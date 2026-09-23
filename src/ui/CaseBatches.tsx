import { listBatches, useArchive } from "../store/archive";
import { formatDateTime } from "../rules/signing";
import type { Specimen } from "../types";
import { Badge, statusOf } from "./common";

/** 案件批次列表 + 案件—检材关联视图（共用本地存档） */
export default function CaseBatches({
  onPick,
  onFilterBatch,
}: {
  onPick: (id: string) => void;
  onFilterBatch: (id: string) => void;
}) {
  const { specimens } = useArchive();
  const batches = listBatches();

  const ofBatch = (id: string) => specimens.filter((s) => s.batchId === id);
  const avg = (list: Specimen[]) =>
    list.length
      ? (list.reduce((a, s) => a + s.temperature, 0) / list.length).toFixed(1)
      : "—";

  return (
    <div className="batch-list">
      {batches.map((b) => {
        const list = ofBatch(b.id);
        const counts = {
          pending: list.filter((s) => s.status === "pending").length,
          submitted: list.filter((s) => s.status === "submitted").length,
          effective: list.filter((s) => s.status === "effective").length,
        };
        return (
          <article key={b.id} className="batch-card">
            <header>
              <div>
                <p className="eyebrow">{b.caseNo}</p>
                <h3>{b.caseName}</h3>
                <p className="muted">{b.unit}</p>
              </div>
              <button className="ghost" onClick={() => onFilterBatch(b.id)}>
                在签发台筛选
              </button>
            </header>
            <div className="batch-meta">
              <span>发现时间：{formatDateTime(b.foundAt)}</span>
              <span>现场：{b.scene}</span>
              <span>
                检材 {list.length} 份 · 平均温度 {avg(list)}℃
              </span>
              <span className="batch-counts">
                <Badge tone="warn">待鉴定 {counts.pending}</Badge>
                <Badge tone="info">待确认 {counts.submitted}</Badge>
                <Badge tone="ok">已生效 {counts.effective}</Badge>
              </span>
            </div>
            <div className="batch-specimens">
              {list.map((s) => (
                <button
                  key={s.id}
                  className="batch-spec"
                  onClick={() => onPick(s.id)}
                >
                  <b>{s.id}</b>
                  <span>{s.species.split(" ")[0]}</span>
                  <small>{s.stage}</small>
                  <Badge tone={statusOf(s).tone}>{statusOf(s).label}</Badge>
                </button>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
