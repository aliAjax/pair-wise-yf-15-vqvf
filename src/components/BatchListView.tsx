import { useMemo, useState } from "react";
import { SPECIES } from "../data";
import type { CaseBatch, Specimen, Stage } from "../types";
import { useStore } from "../store";
import TempChart from "./TempChart";
import { ALL_STAGE_FILTER, StageFilter, StatusBadge } from "./Filters";

type StageFilterValue = Stage | typeof ALL_STAGE_FILTER;

function BatchBlock({
  batch,
  items,
  stage,
  onOpen,
}: {
  batch: CaseBatch;
  items: Specimen[];
  stage: StageFilterValue;
  onOpen: (s: Specimen) => void;
}) {
  const visible = stage === ALL_STAGE_FILTER ? items : items.filter((s) => s.stage === stage);
  const avg =
    items.reduce((sum, s) => sum + s.temperature, 0) / Math.max(1, items.length);

  return (
    <article className="panel batch-block">
      <header className="batch-head">
        <div>
          <p className="eyebrow">{batch.caseNo}</p>
          <h2>{batch.name}</h2>
          <p className="muted">
            发现 {batch.foundAt} · {batch.scene}
          </p>
        </div>
        <div className="batch-stats">
          <span><b>{items.length}</b><small>检材</small></span>
          <span><b>{avg.toFixed(1)}℃</b><small>平均采样温度</small></span>
          <span>
            <b>{items.filter((s) => s.issuance).length}</b>
            <small>已签发</small>
          </span>
        </div>
      </header>

      <p className="batch-summary">{batch.summary}</p>

      <div className="chart-wrap">
        <h3>现场环境温度记录</h3>
        <TempChart points={batch.temps} />
      </div>

      <h3 className="spec-list-title">
        检材列表{stage !== ALL_STAGE_FILTER && ` · 阶段：${stage}`}
        <em>{visible.length} / {items.length}</em>
      </h3>
      {visible.length === 0 ? (
        <p className="muted">该发育阶段下本批次暂无检材。</p>
      ) : (
        <div className="spec-grid">
          {visible.map((s) => (
            <button key={s.id} className="spec-card" onClick={() => onOpen(s)}>
              <div className="spec-card-top">
                <b>{s.sampleNo}</b>
                <StatusBadge status={s.status} />
              </div>
              <h4>{SPECIES[s.species].split(" ")[0]}</h4>
              <p className="spec-stage">{s.stage} · {s.exposure}</p>
              <dl>
                <dt>采样地点</dt>
                <dd>{s.location}</dd>
                <dt>温度 / 采样时刻</dt>
                <dd>{s.temperature}℃ · {s.sampledAt.replace("T", " ")}</dd>
                <dt>保存方式</dt>
                <dd>{s.preservation}</dd>
              </dl>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

export default function BatchListView({
  onOpen,
}: {
  onOpen: (s: Specimen) => void;
}) {
  const { batches, specimens } = useStore();
  const [stage, setStage] = useState<StageFilterValue>(ALL_STAGE_FILTER);

  const counts = useMemo(() => {
    const c: Record<string, number> = { [ALL_STAGE_FILTER]: specimens.length };
    for (const s of specimens) c[s.stage] = (c[s.stage] ?? 0) + 1;
    return c;
  }, [specimens]);

  return (
    <div className="view">
      <div className="panel filter-bar">
        <h3>发育阶段筛选</h3>
        <StageFilter value={stage} onChange={setStage} counts={counts} />
      </div>

      {batches.map((b) => (
        <BatchBlock
          key={b.id}
          batch={b}
          items={specimens.filter((s) => s.batchId === b.id)}
          stage={stage}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
