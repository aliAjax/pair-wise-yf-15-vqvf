// 领域类型：法医昆虫检材鉴定签发台

/** 虫种代码（授权目录以代码为准，避免别名造成的覆盖漏洞） */
export type SpeciesCode =
  | "LUC_SER" // 丝光绿蝇
  | "CHR_MEG" // 大头金蝇
  | "MUS_DOM" // 家蝇
  | "NEC_CIN" // 尸蓝蝇
  | "NEC_RUF" // 绯颜裸金蝇
  | "DER_MAC" // 大负葬甲
  | "SAR_PER" // 棕尾别麻蝇
  | "TEN_SPP"; // 酪跳虫/其他

/** 发育阶段（筛选维度） */
export type Stage =
  | "卵"
  | "幼虫一龄"
  | "幼虫二龄"
  | "幼虫三龄"
  | "蛹"
  | "成虫";

/** 暴露阶段 */
export type Exposure =
  | "新鲜期"
  | "膨胀期"
  | "腐烂期"
  | "后腐烂期"
  | "干化期";

/** 保存方式 */
export type Preservation =
  | "75%乙醇"
  | "95%乙醇"
  | "活体饲养"
  | "干燥针插"
  | "冷冻-20℃"
  | "沸水固定后75%乙醇";

/** 检材状态 */
export type SpecimenStatus =
  | "待鉴定"
  | "已签发"
  | "退回待鉴定";

/** 结论类型 */
export type ConclusionKind =
  | "死亡时间推断"
  | "死亡地点推断"
  | "死后移动证据"
  | "毒物检材支持";

/** 鉴定人证件 */
export interface Examiner {
  id: string;
  name: string;
  title: string;
  certNo: string;
  /** 证件生效日 ISO yyyy-mm-dd */
  validFrom: string;
  /** 证件失效日 ISO yyyy-mm-dd（当日仍有效，次日起失效） */
  validUntil: string;
  /** 授权覆盖虫种代码 */
  species: SpeciesCode[];
}

/** 温度记录点 */
export interface TempPoint {
  /** 相对案发/观测基准的时刻标签，如 09-21 02:00 */
  t: string;
  temp: number;
  /** 是否为采样实测点 */
  sampled?: boolean;
}

/** 案件批次 */
export interface CaseBatch {
  id: string;
  caseNo: string;
  name: string;
  foundAt: string;
  scene: string;
  investigator: string;
  openedAt: string;
  summary: string;
  /** 案件环境温度序列（24h 站点记录） */
  temps: TempPoint[];
}

/** 签发/退回尝试记录（审计痕迹，只读追加） */
export interface AttemptRecord {
  at: string;
  examinerId: string;
  examinerName: string;
  ok: boolean;
  reasons: string[];
  clock: string;
}

/** 生效签发存档 */
export interface Issuance {
  certificateNo: string;
  examinerId: string;
  examinerName: string;
  certNo: string;
  issuedAt: string;
  /** 签发确认时刻的证件有效期快照 */
  certValidFrom: string;
  certValidUntil: string;
  kind: ConclusionKind;
  conclusion: string;
  /** 生效后保留，不再受证件后续失效影响 */
  locked: true;
}

/** 检材 */
export interface Specimen {
  id: string;
  batchId: string;
  sampleNo: string;
  location: string;
  temperature: number;
  exposure: Exposure;
  species: SpeciesCode;
  stage: Stage;
  sampledAt: string;
  preservation: Preservation;
  remark: string;
  status: SpecimenStatus;
  attempts: AttemptRecord[];
  issuance?: Issuance;
}

/** 一次签发确认的规则评估结果 */
export interface SignEvaluation {
  ok: boolean;
  reasons: string[];
  issuance?: Omit<Issuance, "certificateNo">;
}
