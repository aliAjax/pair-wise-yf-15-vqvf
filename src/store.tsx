import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BATCHES,
  BENCH_NOW,
  EXAMINERS,
  SPECIMENS,
} from "./data";
import { evaluateSign, nextCertificateNo } from "./rules";
import type {
  CaseBatch,
  ConclusionKind,
  Examiner,
  Specimen,
} from "./types";

const STORAGE_KEY = "forensic-entomology-console:v1";

/**
 * 存档层：所有批次、检材、鉴定人共用同一份本地数据，
 * 批次列表 / 阶段筛选 / 温度图 / 案件关联 / 详情卡均从这里取数。
 * 规则判定交给 rules.ts，本模块只负责状态与审计痕迹。
 */

interface PersistShape {
  specimens: Specimen[];
  clock: string;
}

interface StoreValue {
  batches: CaseBatch[];
  examiners: Examiner[];
  specimens: Specimen[];
  clock: string;
  setClock: (iso: string) => void;
  advanceClock: (days: number) => void;
  resetAll: () => void;
  sign: (input: {
    specimenId: string;
    examinerId: string;
    kind: ConclusionKind | "";
    conclusion: string;
  }) => { ok: boolean; reasons: string[] };
  updateSpecimen: (
    id: string,
    patch: Partial<Pick<Specimen,
      "location" | "temperature" | "exposure" | "species" |
      "stage" | "sampledAt" | "preservation" | "remark">>
  ) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function loadInitial(): PersistShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistShape;
      if (Array.isArray(parsed.specimens)) {
        return { specimens: parsed.specimens, clock: parsed.clock ?? BENCH_NOW };
      }
    }
  } catch {
    // 存档损坏时回落到预置数据
  }
  return { specimens: SPECIMENS, clock: BENCH_NOW };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(loadInitial, []);
  const [specimens, setSpecimens] = useState<Specimen[]>(initial.specimens);
  const [clock, setClockState] = useState<string>(initial.clock);

  const persist = useCallback((next: Specimen[], nextClock: string) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ specimens: next, clock: nextClock })
      );
    } catch {
      // 隐私模式等场景下放内存态即可
    }
  }, []);

  const setClock = useCallback(
    (iso: string) => {
      setClockState(iso);
      persist(specimens, iso);
    },
    [specimens, persist]
  );

  const advanceClock = useCallback(
    (days: number) => {
      setClockState((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() + days);
        const iso = d.toISOString().slice(0, 16);
        persist(specimens, iso);
        return iso;
      });
    },
    [specimens, persist]
  );

  const resetAll = useCallback(() => {
    setSpecimens(SPECIMENS);
    setClockState(BENCH_NOW);
    persist(SPECIMENS, BENCH_NOW);
  }, [persist]);

  const sign = useCallback<StoreValue["sign"]>(
    ({ specimenId, examinerId, kind, conclusion }) => {
      const target = specimens.find((s) => s.id === specimenId);
      const examiner = EXAMINERS.find((e) => e.id === examinerId);
      if (!target) return { ok: false, reasons: ["检材不存在"] };

      // 已生效签发保留：锁定后不允许重复签发覆盖
      if (target.issuance?.locked) {
        return { ok: false, reasons: ["该检材已有生效签发并已归档锁定，不能重复签发"] };
      }

      const ev = evaluateSign({
        specimen: target,
        examiner,
        kind,
        conclusion,
        clock,
      });

      const attempt = {
        at: new Date().toISOString().slice(0, 16),
        examinerId: examiner?.id ?? "未指定",
        examinerName: examiner?.name ?? "未指定鉴定人",
        ok: ev.ok,
        reasons: ev.reasons,
        clock,
      };

      const next = specimens.map((s) => {
        if (s.id !== specimenId) return s;
        if (ev.ok && ev.issuance) {
          const issuedCount = specimens.filter((x) => x.issuance).length;
          return {
            ...s,
            status: "已签发" as const,
            attempts: [...s.attempts, attempt],
            issuance: {
              ...ev.issuance,
              certificateNo: nextCertificateNo(issuedCount),
            },
          };
        }
        // 任一项不合（含确认前证件失效）=> 退回待鉴定
        return {
          ...s,
          status: "退回待鉴定" as const,
          attempts: [...s.attempts, attempt],
        };
      });

      setSpecimens(next);
      persist(next, clock);
      return { ok: ev.ok, reasons: ev.reasons };
    },
    [specimens, clock, persist]
  );

  const updateSpecimen = useCallback<StoreValue["updateSpecimen"]>(
    (id, patch) => {
      const next = specimens.map((s) => (s.id === id ? { ...s, ...patch } : s));
      setSpecimens(next);
      persist(next, clock);
    },
    [specimens, clock, persist]
  );

  const value = useMemo<StoreValue>(
    () => ({
      batches: BATCHES,
      examiners: EXAMINERS,
      specimens,
      clock,
      setClock,
      advanceClock,
      resetAll,
      sign,
      updateSpecimen,
    }),
    [specimens, clock, setClock, advanceClock, resetAll, sign, updateSpecimen]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore 必须在 StoreProvider 内使用");
  return ctx;
}
