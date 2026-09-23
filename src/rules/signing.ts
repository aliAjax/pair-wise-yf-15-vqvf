// 签发规则层：全部为纯函数，不接触 React 与 localStorage
//
// 核心规则：
//  1. 结论只能由「授权覆盖该虫种」且「证件在签发时点有效」的鉴定人签发，
//     任一项不合，检材退回待鉴定并记录原因。
//  2. 签发后进入「待确认」，确认时按签发时冻结的证件快照复核：
//     若证件在确认之前已经失效，同样退回待鉴定；
//     已生效的结论永久保留，不再受证件后续状态影响。

import type {
  CredentialInfo,
  CredentialSnapshot,
  Examiner,
  Specimen,
} from "../types";

export type SignCheck =
  | { ok: true }
  | { ok: false; reason: string };

/** 仅判断证件在某一时点是否有效（含首尾当日） */
export function isCredentialValidAt(
  cred: Pick<CredentialInfo, "validFrom" | "validUntil">,
  atIso: string,
): boolean {
  const day = atIso.slice(0, 10);
  return day >= cred.validFrom && day <= cred.validUntil;
}

/** 鉴定人是否被授权覆盖指定虫种 */
export function isAuthorizedFor(examiner: Examiner, species: string): boolean {
  return examiner.authorizedSpecies.includes(species);
}

/**
 * 签发前校验：授权 + 证件在当前时钟下有效，缺一退回。
 */
export function checkSign(
  examiner: Examiner,
  species: string,
  nowIso: string,
): SignCheck {
  if (!isAuthorizedFor(examiner, species)) {
    return {
      ok: false,
      reason: `退回待鉴定：${examiner.name} 的授权范围不覆盖该虫种（${species}）。`,
    };
  }
  if (!isCredentialValidAt(examiner.credential, nowIso)) {
    return {
      ok: false,
      reason: `退回待鉴定：${examiner.name} 的证件 ${examiner.credential.number} 有效期为 ${examiner.credential.validFrom} 至 ${examiner.credential.validUntil}，当前已失效。`,
    };
  }
  return { ok: true };
}

/** 签发瞬间冻结证件与授权快照 */
export function freezeCredential(examiner: Examiner): CredentialSnapshot {
  return {
    number: examiner.credential.number,
    validFrom: examiner.credential.validFrom,
    validUntil: examiner.credential.validUntil,
    authorizedSpecies: [...examiner.authorizedSpecies],
  };
}

/**
 * 确认前复核：只看签发时冻结的快照，不看鉴定人档案的当前状态。
 * 签发时已校验过授权，这里仅复核证件有效期在「确认时点」是否仍覆盖。
 */
export function checkConfirm(
  snapshot: CredentialSnapshot,
  nowIso: string,
): SignCheck {
  if (!isCredentialValidAt(snapshot, nowIso)) {
    return {
      ok: false,
      reason: `退回待鉴定：证件 ${snapshot.number} 在确认前已失效（有效期至 ${snapshot.validUntil}），已签发结论不予确认。`,
    };
  }
  return { ok: true };
}

/** 检材当前是否还允许被签发（只有待鉴定态；已生效的永久保留） */
export function canSign(specimen: Specimen): boolean {
  return specimen.status === "pending";
}

/** 检材是否处于待确认 */
export function canConfirm(specimen: Specimen): boolean {
  return specimen.status === "submitted" && !!specimen.signed;
}

export function formatDateTime(iso: string): string {
  return iso.replace("T", " ").replace(/:(\d{2})$/, ":$1");
}

export function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

/** 证件状态标签 */
export function credentialState(
  cred: Pick<CredentialInfo, "validFrom" | "validUntil">,
  nowIso: string,
): { label: string; tone: "ok" | "bad" | "warn" } {
  const day = nowIso.slice(0, 10);
  if (day < cred.validFrom) return { label: "未生效", tone: "warn" };
  if (day > cred.validUntil) return { label: "已失效", tone: "bad" };
  return { label: "有效", tone: "ok" };
}
