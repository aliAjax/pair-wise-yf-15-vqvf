// 存档层：本地数据仓库
// 所有检材、批次、鉴定人数据共用同一份本地存档；
// 界面层只通过本模块的方法读写，规则判断委托 rules 层。

import { useSyncExternalStore } from "react";
import {
  BATCHES,
  EXAMINERS,
  INITIAL_CLOCK,
  INITIAL_SPECIMENS,
} from "../data/constants";
import {
  canConfirm,
  checkConfirm,
  checkSign,
  freezeCredential,
} from "../rules/signing";
import type {
  ArchiveState,
  CaseBatch,
  Examiner,
  Preservation,
  Specimen,
} from "../types";

const STORAGE_KEY = "forensic-entomology-archive-v1";

function buildSeed(): ArchiveState {
  return {
    version: 1,
    clock: INITIAL_CLOCK,
    specimens: structuredClone(INITIAL_SPECIMENS),
  };
}

function load(): ArchiveState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeed();
    const parsed = JSON.parse(raw) as ArchiveState;
    if (parsed.version !== 1 || !Array.isArray(parsed.specimens)) {
      return buildSeed();
    }
    return parsed;
  } catch {
    return buildSeed();
  }
}

let state: ArchiveState = load();
const listeners = new Set<() => void>();

function persist(next: ArchiveState) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 存储不可用时仍保留内存态
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot() {
  return state;
}

/** React 订阅钩子，所有视图共享同一份存档 */
export function useArchive(): ArchiveState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** 非 React 场景（测试、调试）直接读取当前存档 */
export function getState(): ArchiveState {
  return state;
}

// —— 只读查询 ——

export function getExaminer(id: string): Examiner {
  const found = EXAMINERS.find((e) => e.id === id);
  if (!found) throw new Error(`未知鉴定人 ${id}`);
  return found;
}

export function listExaminers(): Examiner[] {
  return EXAMINERS;
}

export function getBatch(id: string): CaseBatch | undefined {
  return BATCHES.find((b) => b.id === id);
}

export function listBatches(): CaseBatch[] {
  return BATCHES;
}

function patchSpecimen(id: string, fn: (s: Specimen) => Specimen) {
  persist({
    ...state,
    specimens: state.specimens.map((s) => (s.id === id ? fn(s) : s)),
  });
}

export interface NewSpecimenInput {
  batchId: string;
  location: string;
  temperature: number;
  exposureStage: Specimen["exposureStage"];
  species: string;
  stage: Specimen["stage"];
  sampledAt: string;
  preservation: Preservation;
  notes: string;
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

// —— 写动作 ——

/** 新增检材，初始为待鉴定 */
export function addSpecimen(input: NewSpecimenInput): ActionResult {
  const seq = state.specimens.length + 1;
  const id = `S${String(seq).padStart(3, "0")}`;
  const specimen: Specimen = {
    id,
    ...input,
    status: "pending",
    events: [
      {
        kind: "created",
        at: state.clock,
        detail: "检材入库登记，等待鉴定签发。",
      },
    ],
  };
  persist({ ...state, specimens: [...state.specimens, specimen] });
  return { ok: true, message: `检材 ${id} 已入库，状态：待鉴定。` };
}

/**
 * 签发结论：
 * 规则不合 → 退回待鉴定（保留事件轨迹）；
 * 规则通过 → 进入待确认，冻结证件快照。
 */
export function signConclusion(
  specimenId: string,
  examinerId: string,
  conclusion: string,
): ActionResult {
  const specimen = state.specimens.find((s) => s.id === specimenId);
  if (!specimen) return { ok: false, message: "检材不存在。" };
  if (specimen.status === "effective")
    return { ok: false, message: "该结论已生效归档，不可重复签发。" };
  if (specimen.status !== "pending")
    return { ok: false, message: "当前状态不允许签发。" };

  const examiner = getExaminer(examinerId);
  const check = checkSign(examiner, specimen.species, state.clock);

  if (!check.ok) {
    patchSpecimen(specimenId, (s) => ({
      ...s,
      status: "pending",
      signed: undefined,
      events: [
        ...s.events,
        {
          kind: "returned",
          at: state.clock,
          actorId: examiner.id,
          actorName: examiner.name,
          detail: check.reason,
        },
      ],
    }));
    return { ok: false, message: check.reason };
  }

  const signed = {
    examinerId: examiner.id,
    examinerName: examiner.name,
    conclusion,
    signedAt: state.clock,
    credentialSnapshot: freezeCredential(examiner),
  };
  patchSpecimen(specimenId, (s) => ({
    ...s,
    status: "submitted",
    signed,
    events: [
      ...s.events,
      {
        kind: "submitted",
        at: state.clock,
        actorId: examiner.id,
        actorName: examiner.name,
        detail: `${examiner.name}签发结论，待授权确认。`,
      },
    ],
  }));
  return {
    ok: true,
    message: `已由 ${examiner.name} 签发，进入待确认队列；确认前证件若失效仍会退回。`,
  };
}

/**
 * 确认结论：按签发时冻结的证件快照复核。
 * 快照证件在当前时钟前失效 → 退回待鉴定；
 * 通过 → 生效归档，此后永久保留。
 */
export function confirmConclusion(specimenId: string): ActionResult {
  const specimen = state.specimens.find((s) => s.id === specimenId);
  if (!specimen || !canConfirm(specimen))
    return { ok: false, message: "该检材不在待确认队列。" };

  const signed = specimen.signed!;
  const check = checkConfirm(signed.credentialSnapshot, state.clock);

  if (!check.ok) {
    patchSpecimen(specimenId, (s) => ({
      ...s,
      status: "pending",
      signed: undefined,
      events: [
        ...s.events,
        {
          kind: "returned",
          at: state.clock,
          actorId: signed.examinerId,
          actorName: signed.examinerName,
          detail: check.reason,
        },
      ],
    }));
    return { ok: false, message: check.reason };
  }

  const effective = { ...signed, confirmedAt: state.clock };
  patchSpecimen(specimenId, (s) => ({
    ...s,
    status: "effective",
    effective,
    events: [
      ...s.events,
      {
        kind: "effective",
        at: state.clock,
        actorId: signed.examinerId,
        actorName: signed.examinerName,
        detail: "证件快照复核有效，结论生效并永久归档。",
      },
    ],
  }));
  return { ok: true, message: "证件快照复核有效，结论已生效归档。" };
}

/** 待确认队列撤回，重新回到待鉴定 */
export function withdrawSubmission(specimenId: string): ActionResult {
  const specimen = state.specimens.find((s) => s.id === specimenId);
  if (!specimen || specimen.status !== "submitted")
    return { ok: false, message: "仅待确认的检材可撤回。" };
  const name = specimen.signed?.examinerName ?? "鉴定人";
  patchSpecimen(specimenId, (s) => ({
    ...s,
    status: "pending",
    signed: undefined,
    events: [
      ...s.events,
      {
        kind: "returned",
        at: state.clock,
        actorId: s.signed?.examinerId,
        actorName: s.signed?.examinerName,
        detail: `${name}的签发已撤回，检材回到待鉴定。`,
      },
    ],
  }));
  return { ok: true, message: "已撤回签发，检材回到待鉴定。" };
}

/** 更新鉴定备注 */
export function updateNotes(specimenId: string, notes: string): ActionResult {
  patchSpecimen(specimenId, (s) => ({ ...s, notes }));
  return { ok: true, message: "鉴定备注已保存。" };
}

/** 前调/设置系统时钟（演示证件在确认前失效的情形） */
export function setClock(iso: string): ActionResult {
  persist({ ...state, clock: iso });
  return { ok: true, message: `系统时钟已设为 ${iso.replace("T", " ")}。` };
}

/** 恢复预置存档 */
export function resetArchive(): ActionResult {
  persist(buildSeed());
  return { ok: true, message: "存档已恢复为预置数据。" };
}
