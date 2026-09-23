// 法医昆虫检材鉴定签发台 —— 领域类型

export type Stage =
  | "卵"
  | "一龄幼虫"
  | "二龄幼虫"
  | "三龄幼虫"
  | "蛹"
  | "成虫";

export type ExposureStage =
  | "新鲜期"
  | "肿胀期"
  | "腐烂期"
  | "后腐烂期"
  | "残骸期";

export type Preservation =
  | "75%乙醇浸泡"
  | "95%乙醇浸泡"
  | "冷冻-20℃"
  | "干燥针插"
  | "活体饲养"
  | "卡氏液固定"
  | "密封冷藏4℃";

/** 检材状态：待鉴定（退回后仍回到此态）/ 待确认 / 已生效 */
export type SpecimenStatus = "pending" | "submitted" | "effective";

export type EventKind = "created" | "submitted" | "effective" | "returned";

export interface CredentialInfo {
  number: string;
  validFrom: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
}

/** 签发瞬间冻结的证件快照，确认时只认快照 */
export interface CredentialSnapshot extends CredentialInfo {
  authorizedSpecies: string[];
}

export interface Examiner {
  id: string;
  name: string;
  title: string;
  org: string;
  credential: CredentialInfo;
  authorizedSpecies: string[];
}

export interface CaseBatch {
  id: string;
  caseNo: string;
  caseName: string;
  unit: string;
  foundAt: string; // 发现时间
  scene: string; // 现场概况
}

export interface SpecimenEvent {
  kind: EventKind;
  at: string; // ISO 本地时刻
  actorId?: string;
  actorName?: string;
  detail: string;
}

export interface SignedConclusion {
  examinerId: string;
  examinerName: string;
  conclusion: string;
  signedAt: string;
  credentialSnapshot: CredentialSnapshot;
}

export interface Specimen {
  id: string;
  batchId: string;
  location: string; // 采样地点
  temperature: number; // 环境温度 ℃
  exposureStage: ExposureStage; // 暴露阶段
  species: string; // 虫种
  stage: Stage; // 发育阶段
  sampledAt: string; // 采样时刻
  preservation: Preservation; // 保存方式
  notes: string; // 鉴定备注
  status: SpecimenStatus;
  events: SpecimenEvent[];
  signed?: SignedConclusion;
  effective?: SignedConclusion & { confirmedAt: string };
}

export interface ArchiveState {
  version: 1;
  clock: string; // 系统当前时刻（可前调，用于演示证件失效）
  specimens: Specimen[];
}
