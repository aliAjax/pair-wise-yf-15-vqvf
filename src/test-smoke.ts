// 规则与存档端到端冒烟测试（Node 环境，mock localStorage）
const mem = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
};

import {
  addSpecimen,
  confirmConclusion,
  resetArchive,
  setClock,
  signConclusion,
  getState,
  withdrawSubmission,
} from "./store/archive";
import { EXPOSURE_STAGES, PRESERVATIONS, SPECIES, STAGES } from "./data/constants";

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean, extra = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name} ${extra}`);
  }
}

resetArchive();

// 1. 越权签发 → 退回待鉴定
// 厩腐蝇只有 E03 韩松岭授权；用 E01 周慕白签发应退回
const r1 = signConclusion("S007", "E01", "测试结论");
const s007 = getState().specimens.find((s) => s.id === "S007")!;
assert("越权签发返回 ok=false", r1.ok === false);
assert("越权后仍为 pending", s007.status === "pending");
assert("退回原因写入轨迹", s007.events.at(-1)?.kind === "returned");
assert("退回原因包含授权提示", r1.message.includes("授权范围不覆盖"));

// 2. 证件失效签发 → 退回（E05 顾长庚证件 2026-08-31 到期，当前 2026-09-23）
const r2 = signConclusion("S001", "E05", "测试结论");
const s001 = getState().specimens.find((s) => s.id === "S001")!;
assert("失效证件签发 ok=false", r2.ok === false);
assert("失效签发退回待鉴定", s001.status === "pending");
assert("退回原因包含已失效", r2.message.includes("已失效"));

// 3. 合法签发 → 待确认；确认 → 生效；生效后不可再签发
const r3 = signConclusion("S001", "E01", "丝光绿蝇三龄幼虫，PMI 推断 60-72h。");
const s001b = getState().specimens.find((s) => s.id === "S001")!;
assert("合法签发 ok=true", r3.ok === true);
assert("签发后 submitted", s001b.status === "submitted");
assert("签发冻结证件快照", !!s001b.signed?.credentialSnapshot);

const r4 = confirmConclusion("S001");
const s001c = getState().specimens.find((s) => s.id === "S001")!;
assert("确认 ok=true", r4.ok === true);
assert("确认后 effective", s001c.status === "effective");
assert("生效结论保留", !!s001c.effective && s001c.effective.conclusion.includes("PMI"));

// 4. 已生效结论不受证件后来失效影响
setClock("2027-06-01T10:00");
const s001d = getState().specimens.find((s) => s.id === "S001")!;
assert("时钟越过证件有效期后结论仍生效", s001d.status === "effective");
assert("生效结论完整保留", s001d.effective?.credentialSnapshot.validUntil === "2026-12-31");
setClock("2026-09-23T09:00");

// 5. 签发后、确认前证件失效 → 确认时退回
// 预置数据中 S003 黑颊丽蝇已由 E02 林知夏（证件 2026-09-30 到期）签发待确认
resetArchive();
const s003pre = getState().specimens.find((s) => s.id === "S003")!;
assert(
  "S003 预置为 E02 待确认",
  s003pre.status === "submitted" && s003pre.signed?.examinerId === "E02",
);
setClock("2026-10-05T09:00");
const r6 = confirmConclusion("S003");
const s003 = getState().specimens.find((s) => s.id === "S003")!;
assert("确认前证件失效 → ok=false", r6.ok === false);
assert("确认被退回 pending", s003.status === "pending");
assert("退回后清除签发载荷", s003.signed === undefined);
assert("轨迹记录退回", s003.events.at(-1)?.kind === "returned");
assert("退回原因提到确认前失效", r6.message.includes("确认前已失效"));

// 6. 临界日：到期当日仍有效（2026-09-30）
setClock("2026-09-30T23:00");
const r7 = signConclusion("S009", "E02", "丝光绿蝇一龄幼虫。");
assert("到期当日签发仍成功（含首尾日）", r7.ok);

// 7. 撤回签发
const r8 = withdrawSubmission("S009");
const s009 = getState().specimens.find((s) => s.id === "S009")!;
assert("撤回 ok=true", r8.ok);
assert("撤回后 pending", s009.status === "pending");

// 8. 新增检材入库
setClock("2026-09-23T09:00");
const before = getState().specimens.length;
const r9 = addSpecimen({
  batchId: "B2",
  location: "测试地点",
  temperature: 26.5,
  exposureStage: EXPOSURE_STAGES[2],
  species: SPECIES[2],
  stage: STAGES[3],
  sampledAt: "2026-09-23T08:00",
  preservation: PRESERVATIONS[0],
  notes: "自动化测试",
});
const after = getState().specimens.length;
assert("新增检材 ok", r9.ok && after === before + 1);
const added = getState().specimens.at(-1)!;
assert("新检材初始待鉴定", added.status === "pending");

// 9. 持久化：重新加载 store（模拟刷新）后数据仍在
const raw = JSON.parse(mem.get("forensic-entomology-archive-v1")!);
assert("localStorage 已持久化", raw.specimens.length === after);
assert("持久化含系统时钟", raw.clock === "2026-09-23T09:00");

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
