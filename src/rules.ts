import type {
  ConclusionKind,
  Examiner,
  SignEvaluation,
  Specimen,
} from "./types";
import { SPECIES } from "./data";

/** 日期比较：ISO yyyy-mm-dd，按自然日判定，失效当日仍有效 */
export function certStateAt(
  examiner: Pick<Examiner, "validFrom" | "validUntil">,
  clock: string
): "未生效" | "有效" | "今日到期" | "已失效" {
  const day = clock.slice(0, 10);
  if (day < examiner.validFrom) return "未生效";
  if (day > examiner.validUntil) return "已失效";
  if (day === examiner.validUntil) return "今日到期";
  return "有效";
}

export function isCertValidAt(examiner: Examiner, clock: string): boolean {
  const s = certStateAt(examiner, clock);
  return s === "有效" || s === "今日到期";
}

export function coversSpecies(examiner: Examiner, species: Specimen["species"]): boolean {
  return examiner.species.includes(species);
}

/** 必填检材字段（任一缺失即不能进入签发） */
const REQUIRED_FIELDS: Array<{ key: keyof Specimen; label: string }> = [
  { key: "location", label: "采样地点" },
  { key: "temperature", label: "环境温度" },
  { key: "exposure", label: "暴露阶段" },
  { key: "species", label: "虫种" },
  { key: "stage", label: "发育阶段" },
  { key: "sampledAt", label: "采样时刻" },
  { key: "preservation", label: "保存方式" },
];

/**
 * 签发规则（纯函数）：
 * 1. 检材八项业务字段齐备（鉴定备注可空）；
 * 2. 鉴定人证件在「确认时刻」有效（含到期当日；确认前已失效即退回）；
 * 3. 鉴定人授权目录覆盖该检材虫种；
 * 4. 结论类型与结论文本已填写。
 * 任一项不合 => ok=false 并附全部退回原因；已生效签发由调用方锁定保留，
 * 证件事后失效不改变既有结论。
 */
export function evaluateSign(input: {
  specimen: Specimen;
  examiner: Examiner | undefined;
  kind: ConclusionKind | "";
  conclusion: string;
  clock: string;
}): SignEvaluation {
  const { specimen, examiner, kind, conclusion, clock } = input;
  const reasons: string[] = [];

  // 规则一：检材字段完整性
  for (const f of REQUIRED_FIELDS) {
    const v = specimen[f.key];
    if (v === undefined || v === null || v === "" ||
        (typeof v === "number" && Number.isNaN(v))) {
      reasons.push(`检材字段缺失：${f.label}`);
    }
  }

  // 规则二/三：鉴定人选择、授权覆盖、证件时效
  if (!examiner) {
    reasons.push("未指定签发鉴定人");
  } else {
    if (!coversSpecies(examiner, specimen.species)) {
      reasons.push(
        `授权不覆盖：${examiner.name} 的授权目录不含「${SPECIES[specimen.species]}」`
      );
    }
    const state = certStateAt(examiner, clock);
    if (state === "已失效") {
      reasons.push(
        `证件已失效：${examiner.certNo} 有效期至 ${examiner.validUntil}，确认时刻 ${clock.slice(0, 10)} 已过期`
      );
    } else if (state === "未生效") {
      reasons.push(
        `证件尚未生效：${examiner.certNo} 自 ${examiner.validFrom} 起生效`
      );
    }
  }

  // 规则四：结论
  if (!kind) reasons.push("未选择结论类型");
  if (!conclusion.trim()) reasons.push("鉴定结论为空");

  if (reasons.length > 0) return { ok: false, reasons };

  const e = examiner!;
  return {
    ok: true,
    reasons: [],
    issuance: {
      examinerId: e.id,
      examinerName: e.name,
      certNo: e.certNo,
      issuedAt: clock,
      certValidFrom: e.validFrom,
      certValidUntil: e.validUntil,
      kind: kind as ConclusionKind,
      conclusion: conclusion.trim(),
      locked: true,
    },
  };
}

/** 生成存档证书编号 */
export function nextCertificateNo(issuedCount: number): string {
  const seq = String(issuedCount + 1).padStart(3, "0");
  return `江州法医昆虫鉴字[2026]第${seq}号`;
}
