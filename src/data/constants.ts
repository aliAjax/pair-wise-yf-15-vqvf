import type {
  CaseBatch,
  Examiner,
  ExposureStage,
  Preservation,
  Specimen,
  Stage,
} from "../types";

// 系统时钟基准（演示用，可在界面上前进时间）
export const INITIAL_CLOCK = "2026-09-23T09:00";

export const STAGES: Stage[] = [
  "卵",
  "一龄幼虫",
  "二龄幼虫",
  "三龄幼虫",
  "蛹",
  "成虫",
];

export const EXPOSURE_STAGES: ExposureStage[] = [
  "新鲜期",
  "肿胀期",
  "腐烂期",
  "后腐烂期",
  "残骸期",
];

export const PRESERVATIONS: Preservation[] = [
  "75%乙醇浸泡",
  "95%乙醇浸泡",
  "冷冻-20℃",
  "干燥针插",
  "活体饲养",
  "卡氏液固定",
  "密封冷藏4℃",
];

export const SPECIES = [
  "丝光绿蝇 Lucilia sericata",
  "大头金蝇 Chrysomya megacephala",
  "棕尾别麻蝇 Boettcherisca peregrina",
  "厩腐蝇 Muscina stabulans",
  "黑颊丽蝇 Calliphora vomitoria",
  "赤颈郭公虫 Necrobia rufipes",
];

// —— 预置五名鉴定人（授权虫种 + 证件有效期各不相同）——
export const EXAMINERS: Examiner[] = [
  {
    id: "E01",
    name: "周慕白",
    title: "主任法医师",
    org: "省公安厅物证鉴定中心",
    credential: {
      number: "FJ-2024-0318",
      validFrom: "2024-01-01",
      validUntil: "2026-12-31",
    },
    authorizedSpecies: [
      "丝光绿蝇 Lucilia sericata",
      "大头金蝇 Chrysomya megacephala",
      "棕尾别麻蝇 Boettcherisca peregrina",
    ],
  },
  {
    id: "E02",
    name: "林知夏",
    title: "主检法医师",
    org: "市公安局刑事科学技术研究所",
    credential: {
      number: "FJ-2025-0107",
      validFrom: "2025-03-01",
      validUntil: "2026-09-30",
    },
    authorizedSpecies: [
      "丝光绿蝇 Lucilia sericata",
      "黑颊丽蝇 Calliphora vomitoria",
    ],
  },
  {
    id: "E03",
    name: "韩松岭",
    title: "副主任法医师",
    org: "医学院法医病理教研室",
    credential: {
      number: "FJ-2023-0042",
      validFrom: "2023-06-01",
      validUntil: "2026-10-01",
    },
    authorizedSpecies: [
      "棕尾别麻蝇 Boettcherisca peregrina",
      "厩腐蝇 Muscina stabulans",
    ],
  },
  {
    id: "E04",
    name: "沈青鸢",
    title: "法医师",
    org: "省公安厅物证鉴定中心",
    credential: {
      number: "FJ-2026-0256",
      validFrom: "2026-08-01",
      validUntil: "2028-07-31",
    },
    authorizedSpecies: [
      "大头金蝇 Chrysomya megacephala",
      "赤颈郭公虫 Necrobia rufipes",
    ],
  },
  {
    id: "E05",
    name: "顾长庚",
    title: "授权签字人",
    org: "司法鉴定所昆虫物证室",
    credential: {
      number: "FJ-2022-0099",
      validFrom: "2022-05-01",
      validUntil: "2026-08-31",
    }, // 证件已过期
    authorizedSpecies: [
      "丝光绿蝇 Lucilia sericata",
      "大头金蝇 Chrysomya megacephala",
      "棕尾别麻蝇 Boettcherisca peregrina",
      "黑颊丽蝇 Calliphora vomitoria",
    ],
  },
];

// —— 预置三个案件批次 ——
export const BATCHES: CaseBatch[] = [
  {
    id: "B1",
    caseNo: "A2026-0912",
    caseName: "城郊林地无名尸案",
    unit: "城西分局刑侦大队",
    foundAt: "2026-09-12T06:40",
    scene: "阔叶林林下腐殖土，半阴，近排水沟",
  },
  {
    id: "B2",
    caseNo: "A2026-0917",
    caseName: "河湾废弃工棚命案",
    unit: "水上分局刑侦大队",
    foundAt: "2026-09-17T09:10",
    scene: "废弃工棚室内水泥地，门窗半开，通风",
  },
  {
    id: "B3",
    caseNo: "A2026-0920",
    caseName: "高架桥下出租屋案",
    unit: "桥北分局刑侦大队",
    foundAt: "2026-09-20T14:25",
    scene: "密闭出租屋卧室，空调断电，环境闷热",
  },
];

const ISO = (d: string) => `${d}T09:00`;

// —— 预置检材（含待鉴定 / 待确认 / 已生效 / 退回 四种情形）——
export const INITIAL_SPECIMENS: Specimen[] = [
  {
    id: "S001",
    batchId: "B1",
    location: "林缘排水沟北岸腐殖土表层",
    temperature: 24.6,
    exposureStage: "腐烂期",
    species: "丝光绿蝇 Lucilia sericata",
    stage: "三龄幼虫",
    sampledAt: ISO("2026-09-14"),
    preservation: "75%乙醇浸泡",
    notes: "幼虫活跃，体长12.3–14.8mm，标本量充足。",
    status: "pending",
    events: [
      { kind: "created", at: ISO("2026-09-14"), detail: "检材入库登记" },
    ],
  },
  {
    id: "S002",
    batchId: "B1",
    location: "尸体右下腹部衣物内侧",
    temperature: 23.8,
    exposureStage: "肿胀期",
    species: "棕尾别麻蝇 Boettcherisca peregrina",
    stage: "一龄幼虫",
    sampledAt: ISO("2026-09-13"),
    preservation: "活体饲养",
    notes: "麻蝇初孵幼虫，建议饲养至二龄再复核。",
    status: "pending",
    events: [
      { kind: "created", at: ISO("2026-09-13"), detail: "检材入库登记" },
    ],
  },
  {
    id: "S003",
    batchId: "B1",
    location: "尸体头部下方土壤 5cm 深处",
    temperature: 21.4,
    exposureStage: "后腐烂期",
    species: "黑颊丽蝇 Calliphora vomitoria",
    stage: "蛹",
    sampledAt: ISO("2026-09-18"),
    preservation: "密封冷藏4℃",
    notes: "蛹壳完整，部分蛹可见羽化裂隙。",
    status: "submitted",
    events: [
      { kind: "created", at: ISO("2026-09-18"), detail: "检材入库登记" },
      {
        kind: "submitted",
        at: "2026-09-20T11:20",
        actorId: "E02",
        actorName: "林知夏",
        detail: "林知夏签发结论，待授权确认",
      },
    ],
    signed: {
      examinerId: "E02",
      examinerName: "林知夏",
      conclusion:
        "黑颊丽蝇蛹期标本，结合蛹壳特征与现场积温，推断死亡时间约 11–14 天。",
      signedAt: "2026-09-20T11:20",
      credentialSnapshot: {
        number: "FJ-2025-0107",
        validFrom: "2025-03-01",
        validUntil: "2026-09-30",
        authorizedSpecies: [
          "丝光绿蝇 Lucilia sericata",
          "黑颊丽蝇 Calliphora vomitoria",
        ],
      },
    },
  },
  {
    id: "S004",
    batchId: "B1",
    location: "尸体左肩背皮肤创口边缘",
    temperature: 25.9,
    exposureStage: "腐烂期",
    species: "大头金蝇 Chrysomya megacephala",
    stage: "二龄幼虫",
    sampledAt: ISO("2026-09-15"),
    preservation: "95%乙醇浸泡",
    notes: "创口集中孳生，需与丝光绿蝇幼虫区分。",
    status: "pending",
    events: [
      { kind: "created", at: ISO("2026-09-15"), detail: "检材入库登记" },
      {
        kind: "returned",
        at: "2026-09-19T15:40",
        actorId: "E05",
        actorName: "顾长庚",
        detail: "退回待鉴定：鉴定人证件 FJ-2022-0099 已于 2026-08-31 失效。",
      },
    ],
  },
  {
    id: "S005",
    batchId: "B2",
    location: "工棚西北角地面蝇卵团",
    temperature: 27.2,
    exposureStage: "新鲜期",
    species: "丝光绿蝇 Lucilia sericata",
    stage: "卵",
    sampledAt: ISO("2026-09-17"),
    preservation: "卡氏液固定",
    notes: "卵块约 180 粒，发育早期，未见孵化。",
    status: "effective",
    events: [
      { kind: "created", at: ISO("2026-09-17"), detail: "检材入库登记" },
      {
        kind: "submitted",
        at: "2026-09-18T10:05",
        actorId: "E01",
        actorName: "周慕白",
        detail: "周慕白签发结论，待授权确认",
      },
      {
        kind: "effective",
        at: "2026-09-18T16:30",
        actorId: "E01",
        actorName: "周慕白",
        detail: "证件有效且覆盖该虫种，结论生效归档。",
      },
    ],
    signed: {
      examinerId: "E01",
      examinerName: "周慕白",
      conclusion:
        "丝光绿蝇卵期标本，处于胚胎发育早期；依现场 27.2℃ 积温推算产卵时间约为采样前 6–9 小时。",
      signedAt: "2026-09-18T10:05",
      credentialSnapshot: {
        number: "FJ-2024-0318",
        validFrom: "2024-01-01",
        validUntil: "2026-12-31",
        authorizedSpecies: [
          "丝光绿蝇 Lucilia sericata",
          "大头金蝇 Chrysomya megacephala",
          "棕尾别麻蝇 Boettcherisca peregrina",
        ],
      },
    },
    effective: {
      examinerId: "E01",
      examinerName: "周慕白",
      conclusion:
        "丝光绿蝇卵期标本，处于胚胎发育早期；依现场 27.2℃ 积温推算产卵时间约为采样前 6–9 小时。",
      signedAt: "2026-09-18T10:05",
      confirmedAt: "2026-09-18T16:30",
      credentialSnapshot: {
        number: "FJ-2024-0318",
        validFrom: "2024-01-01",
        validUntil: "2026-12-31",
        authorizedSpecies: [
          "丝光绿蝇 Lucilia sericata",
          "大头金蝇 Chrysomya megacephala",
          "棕尾别麻蝇 Boettcherisca peregrina",
        ],
      },
    },
  },
  {
    id: "S006",
    batchId: "B2",
    location: "尸体口鼻腔及右眼眶周围",
    temperature: 28.1,
    exposureStage: "肿胀期",
    species: "大头金蝇 Chrysomya megacephala",
    stage: "三龄幼虫",
    sampledAt: ISO("2026-09-18"),
    preservation: "75%乙醇浸泡",
    notes: "三龄幼虫大量孳生，平均体长 15.6mm。",
    status: "pending",
    events: [
      { kind: "created", at: ISO("2026-09-18"), detail: "检材入库登记" },
    ],
  },
  {
    id: "S007",
    batchId: "B2",
    location: "工棚木梁与墙面缝隙",
    temperature: 26.3,
    exposureStage: "腐烂期",
    species: "厩腐蝇 Muscina stabulans",
    stage: "成虫",
    sampledAt: ISO("2026-09-19"),
    preservation: "干燥针插",
    notes: "网捕成虫 7 只，翅完整，可用于种属形态比对。",
    status: "pending",
    events: [
      { kind: "created", at: ISO("2026-09-19"), detail: "检材入库登记" },
    ],
  },
  {
    id: "S008",
    batchId: "B2",
    location: "尸体下方压痕土壤内",
    temperature: 22.7,
    exposureStage: "后腐烂期",
    species: "棕尾别麻蝇 Boettcherisca peregrina",
    stage: "蛹",
    sampledAt: ISO("2026-09-21"),
    preservation: "活体饲养",
    notes: "入土化蛹样本，恒温 25℃ 饲养待羽化。",
    status: "pending",
    events: [
      { kind: "created", at: ISO("2026-09-21"), detail: "检材入库登记" },
    ],
  },
  {
    id: "S009",
    batchId: "B3",
    location: "卧室床铺被褥褶皱处",
    temperature: 31.5,
    exposureStage: "新鲜期",
    species: "丝光绿蝇 Lucilia sericata",
    stage: "一龄幼虫",
    sampledAt: ISO("2026-09-20"),
    preservation: "95%乙醇浸泡",
    notes: "高温密闭环境，发育进度偏快。",
    status: "pending",
    events: [
      { kind: "created", at: ISO("2026-09-20"), detail: "检材入库登记" },
    ],
  },
  {
    id: "S010",
    batchId: "B3",
    location: "卧室窗台积尘处",
    temperature: 30.2,
    exposureStage: "肿胀期",
    species: "赤颈郭公虫 Necrobia rufipes",
    stage: "成虫",
    sampledAt: ISO("2026-09-21"),
    preservation: "干燥针插",
    notes: "郭公虫成虫 3 只，属尸食性甲虫，指示中晚期演替。",
    status: "pending",
    events: [
      { kind: "created", at: ISO("2026-09-21"), detail: "检材入库登记" },
    ],
  },
  {
    id: "S011",
    batchId: "B3",
    location: "客厅门口地毯纤维下",
    temperature: 29.4,
    exposureStage: "腐烂期",
    species: "大头金蝇 Chrysomya megacephala",
    stage: "卵",
    sampledAt: ISO("2026-09-21"),
    preservation: "冷冻-20℃",
    notes: "卵块已冷冻固定，制片镜检用。",
    status: "pending",
    events: [
      { kind: "created", at: ISO("2026-09-21"), detail: "检材入库登记" },
    ],
  },
  {
    id: "S012",
    batchId: "B3",
    location: "卫生间地漏周边毛发杂物",
    temperature: 28.8,
    exposureStage: "后腐烂期",
    species: "厩腐蝇 Muscina stabulans",
    stage: "二龄幼虫",
    sampledAt: ISO("2026-09-22"),
    preservation: "75%乙醇浸泡",
    notes: "地漏附近二次孳生，需结合现场出入记录判断。",
    status: "pending",
    events: [
      { kind: "created", at: ISO("2026-09-22"), detail: "检材入库登记" },
    ],
  },
];
