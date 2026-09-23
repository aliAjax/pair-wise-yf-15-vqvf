import { useMemo, useState } from "react";
import { SPECIES } from "../data";
import type { Specimen, Stage } from "../types";
import { useStore } from "../store";
import TempChart from "./TempChart";
import { ALL_STAGE_FILTER, StageFilter, StatusBadge } from "./Filters";

type StageFilterValue = Stage | typeof ALL_STAGE_FILTER;

export default function CaseLinkView({
  onOpen,
}: {
  onOpen: (s: Specimen) => void;
}) {
  const { batches, specimens } = useStore();
  const [batchId, setBatchId] = useState(batches[0].id);
  const [stage, setStage] = useState<StageFilterValue>(ALL_STAGE_FILTER);

  const batch = batches.find((b) => b.id === batchId)!;
  const linked = specimens.filter((s) => s.batchId === batchId);
  const visible =
    stage === ALL_STAGE_FILTER
      ? linked
      : linked.filter((s) => s.stage === stage);

  const counts = useMemo(() => {
    const c: Record<string, number> = { [ALL_STAGE_FILTER]: linked.length };
    for (const s of linked) c[s.stage] = (c[s.stage] ?? 0) + 1;
    return c;
  }, [linked]);

  // 虫种 × 阶段关联矩阵（案件虫群构成）
  const matrix = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    for (const s of linked) {
      const row = m.get(s.species) ?? new Map<string, number>();
      row.set(s.stage, (row.get(s.stage) ?? 0) + 1);
      m.set(s.species, row);
    }
    return m;
  }, [linked]);

  return (
    <div className="view case-view">
      <div className="case-layout">
        <aside className="panel case-tabs">
          <h3>案件批次</h3>
          {batches.map((b) => {
            const n = specimens.filter((s) => s.batchId === b.id).length;
            return (
              <button
                key={b.id}
                className={
                  "case-tab" + (b.id === batchId ? " active" : "")
                }
                onClick={() => {
                  setBatchId(b.id);
                  setStage(ALL_STAGE_FILTER);
                }}
              >
                <b>{b.name}</b>
                <small>{b.caseNo}</small>
                <small>
                  {b.foundAt} · 关联检材 {n}
                </small>
              </button>
            );
          })}
        </aside>

        <section className="case-main">
          <div className="panel">
            <p className="eyebrow">{batch.caseNo}</p>
            <h2>{batch.name}</h2>
            <div className="case-meta">
              <span>发现地点：{batch.scene}</span>
              <span>发现日期：{batch.foundAt}</span>
              <span>立案：{batch.openedAt}</span>
              <span>承办：{batch.investigator}</span>
            </div>
            <p className="batch-summary">{batch.summary}</p>
          </div>

          <div className="panel filter-bar">
            <h3>发育阶段筛选（本案件）</h3>
            <StageFilter value={stage} onChange={setStage} counts={counts} />
          </div>

          <div className="panel">
            <h3>现场温度记录与采样点</h3>
            <TempChart points={batch.temps} />
          </div>

          <div className="panel">
            <h3>虫种 × 发育阶段关联矩阵</h3>
            <div className="matrix-wrap">
              <table className="matrix">
                <thead>
                  <tr>
                    <th>虫种</th>
                    {["卵", "幼虫一龄", "幼虫二龄", "幼虫三龄", "蛹", "成虫"].map(
                      (st) => (
                        <th key={st}>{st.replace("幼虫", "L")}</th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[...matrix.entries()].map(([code, row]) => (
                    <tr key={code}>
                      <th>{SPECIES[code as keyof typeof SPECIES].split(" ")[0]}</th>
                      {["卵", "幼虫一龄", "幼虫二龄", "幼虫三龄", "蛹", "成虫"].map(
                        (st) => (
                          <td key={st} className={row.get(st) ? "has" : ""}>
                            {row.get(st) ?? ""}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <h3>
              关联检材<em className="count-em">{visible.length} 份</em>
            </h3>
            <div className="link-list">
              {visible.map((s) => {
                const sampleTemp = batch.temps.find(
                  (p) =>
                    p.sampled &&
                    p.temp.toFixed(1) === s.temperature.toFixed(1)
                );
                return (
                  <button
                    key={s.id}
                    className="link-row"
                    onClick={() => onOpen(s)}
                  >
                    <div className="link-id">
                      <b>{s.sampleNo}</b>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="link-info">
                      <b>{SPECIES[s.species]}</b>
                      <span>
                        {s.stage} · {s.exposure} · {s.location}
                      </span>
                      <span className="muted small">{s.remark}</span>
                    </div>
                    <div className="link-nums">
                      <b>{s.temperature}℃</b>
                      <span>{s.sampledAt.replace("T", " ")}</span>
                      {sampleTemp && (
                        <span className="mini-badge cert-ok">
                          与站点温度互证
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {visible.length === 0 && (
                <p className="muted">该阶段下本案件暂无关联检材。</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
