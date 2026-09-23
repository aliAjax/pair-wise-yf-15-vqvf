import { useMemo } from "react";
import { STAGES } from "../data/constants";
import { listBatches, useArchive } from "../store/archive";
import type { Specimen } from "../types";
import { Badge, statusOf } from "./common";

const ALL_STAGES = STAGES;

export type StatusFilter = "all" | "pending" | "submitted" | "effective";

/** 签发工作台：批次列表、发育阶段筛选、状态筛选与检材队列共用同一份本地数据 */
export default function Workbench({
  batchFilter,
  setBatchFilter,
  stageFilter,
  toggleStage,
  statusFilter,
  setStatusFilter,
  onPick,
}: {
  batchFilter: string | "all";
  setBatchFilter: (id: string | "all") => void;
  stageFilter: Set<string>;
  toggleStage: (stage: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (s: StatusFilter) => void;
  onPick: (id: string) => void;
}) {
  const { specimens } = useArchive();
  const batches = listBatches();

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    batches.forEach((b) => (c[b.id] = 0));
    specimens.forEach((s) => (c[s.batchId] = (c[s.batchId] ?? 0) + 1));
    return c;
  }, [specimens, batches]);

  const rows = specimens.filter(
    (s) =>
      (batchFilter === "all" || s.batchId === batchFilter) &&
      stageFilter.has(s.stage) &&
      (statusFilter === "all" ||
        (statusFilter === "pending" && s.status === "pending") ||
        (statusFilter === "submitted" && s.status === "submitted") ||
        (statusFilter === "effective" && s.status === "effective")),
  );

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "pending", label: "待鉴定" },
    { key: "submitted", label: "待确认" },
    { key: "effective", label: "已生效" },
  ];

  return (
    <div className="workspace-grid">
      <aside className="panel sidebar">
        <h2>案件批次</h2>
        <button
          className={`side-item ${batchFilter === "all" ? "active" : ""}`}
          onClick={() => setBatchFilter("all")}
        >
          <span>全部批次</span>
          <b>{specimens.length}</b>
        </button>
        {batches.map((b) => (
          <button
            key={b.id}
            className={`side-item ${batchFilter === b.id ? "active" : ""}`}
            onClick={() => setBatchFilter(b.id)}
          >
            <span>
              {b.caseNo}
              <small>{b.caseName}</small>
            </span>
            <b>{counts[b.id] ?? 0}</b>
          </button>
        ))}

        <h2 className="mt">状态队列</h2>
        <div className="status-tabs">
          {statusTabs.map((t) => (
            <button
              key={t.key}
              className={statusFilter === t.key ? "active" : ""}
              onClick={() => setStatusFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </aside>

      <section className="panel">
        <div className="heading">
          <div>
            <p className="eyebrow">发育阶段筛选</p>
            <h2>检材签发队列</h2>
          </div>
          <span className="muted">命中 {rows.length} 份</span>
        </div>
        <StageChips selected={stageFilter} toggle={toggleStage} />

        <div className="specimen-rows">
          {rows.length === 0 && <p className="empty">没有符合筛选条件的检材。</p>}
          {rows.map((s) => (
            <SpecimenRow key={s.id} specimen={s} onPick={onPick} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function StageChips({
  selected,
  toggle,
}: {
  selected: Set<string>;
  toggle: (stage: string) => void;
}) {
  // 从共享常量取阶段，保证与数据层一致
  const stages = ALL_STAGES;
  return (
    <div className="chips">
      {stages.map((st) => (
        <button
          key={st}
          className={selected.has(st) ? "chip-on" : ""}
          onClick={() => toggle(st)}
        >
          {st}
        </button>
      ))}
    </div>
  );
}


function SpecimenRow({
  specimen,
  onPick,
}: {
  specimen: Specimen;
  onPick: (id: string) => void;
}) {
  const batch = listBatches().find((b) => b.id === specimen.batchId);
  const st = statusOf(specimen);
  return (
    <button className="specimen-row" onClick={() => onPick(specimen.id)}>
      <div className="row-top">
        <b>{specimen.id}</b>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>
      <h3>{specimen.species}</h3>
      <p>
        {batch?.caseNo} · {specimen.stage} · {specimen.exposureStage} ·{" "}
        {specimen.temperature.toFixed(1)}℃
      </p>
      <small className="muted">
        {specimen.location} ｜ {specimen.sampledAt.replace("T", " ")}
        {specimen.signed ? ` ｜ 签发：${specimen.signed.examinerName}` : ""}
        {specimen.effective
          ? ` ｜ 生效：${specimen.effective.examinerName}`
          : ""}
      </small>
    </button>
  );
}
