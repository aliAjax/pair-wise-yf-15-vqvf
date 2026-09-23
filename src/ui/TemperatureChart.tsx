import { useMemo, useState } from "react";
import { listBatches, useArchive } from "../store/archive";
import type { Specimen } from "../types";
import { Badge, statusOf } from "./common";

const W = 760;
const H = 340;
const PAD = { top: 24, right: 20, bottom: 44, left: 46 };

const BATCH_COLOR: Record<string, string> = {
  B1: "#365314",
  B2: "#a16207",
  B3: "#dc2626",
};

/** 温度记录图：按采样时刻排列各检材环境温度，纯 SVG 绘制，批次着色 */
export default function TemperatureChart({
  filterBatch,
  filterStages,
  onPick,
}: {
  filterBatch: string | "all";
  filterStages: Set<string>;
  onPick: (id: string) => void;
}) {
  const archive = useArchive();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<string | null>(null);

  const batches = listBatches();
  const rows = useMemo(() => {
    return archive.specimens
      .filter(
        (s) =>
          (filterBatch === "all" || s.batchId === filterBatch) &&
          filterStages.has(s.stage),
      )
      .sort((a, b) => a.sampledAt.localeCompare(b.sampledAt));
  }, [archive.specimens, filterBatch, filterStages]);

  if (rows.length === 0)
    return <p className="empty">当前筛选条件下没有温度记录。</p>;

  const times = rows.map((r) => new Date(r.sampledAt).getTime());
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const temps = rows.map((r) => r.temperature);
  const yMin = Math.floor(Math.min(...temps) - 2);
  const yMax = Math.ceil(Math.max(...temps) + 2);
  const xSpan = Math.max(tMax - tMin, 1);

  const x = (t: number) =>
    PAD.left + ((t - tMin) / xSpan) * (W - PAD.left - PAD.right);
  const y = (temp: number) =>
    PAD.top +
    (1 - (temp - yMin) / (yMax - yMin || 1)) * (H - PAD.top - PAD.bottom);

  const yTicks = Array.from(
    { length: yMax - yMin + 1 },
    (_, i) => yMin + i,
  ).filter((v) => v % 2 === 0);

  const groups = new Map<string, Specimen[]>();
  rows.forEach((r) => {
    groups.set(r.batchId, [...(groups.get(r.batchId) ?? []), r]);
  });

  const toggleBatch = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const hovered = hover ? rows.find((r) => r.id === hover) : null;

  return (
    <div className="chart-wrap">
      <div className="legend">
        {batches
          .filter((b) => groups.has(b.id))
          .map((b) => {
            const off = hidden.has(b.id);
            return (
              <button
                key={b.id}
                className={`legend-item ${off ? "off" : ""}`}
                onClick={() => toggleBatch(b.id)}
              >
                <i style={{ background: BATCH_COLOR[b.id] }} />
                {b.caseNo}
              </button>
            );
          })}
        <span className="muted small">点圆点查看检材详情，点图例隐藏批次</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img"
        aria-label="各检材采样环境温度随采样时刻分布图">
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              className="grid-line"
            />
            <text x={PAD.left - 8} y={y(t) + 4} className="axis-text" textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        <line
          x1={PAD.left}
          x2={PAD.left}
          y1={PAD.top}
          y2={H - PAD.bottom}
          className="axis"
        />
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={H - PAD.bottom}
          y2={H - PAD.bottom}
          className="axis"
        />
        <text x={12} y={PAD.top - 8} className="axis-title">℃</text>

        {[...groups.entries()].map(([bid, list]) => {
          if (hidden.has(bid)) return null;
          const sorted = [...list].sort((a, b) =>
            a.sampledAt.localeCompare(b.sampledAt),
          );
          const pts = sorted
            .map((r) => `${x(new Date(r.sampledAt).getTime())},${y(r.temperature)}`)
            .join(" ");
          const color = BATCH_COLOR[bid];
          return (
            <g key={bid}>
              <polyline points={pts} fill="none" stroke={color}
                strokeWidth={2} strokeOpacity={0.45} />
              {sorted.map((r) => {
                const cx = x(new Date(r.sampledAt).getTime());
                const cy = y(r.temperature);
                const active = hover === r.id;
                return (
                  <g key={r.id}
                    onMouseEnter={() => setHover(r.id)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => onPick(r.id)}
                    className="dot-group">
                    <circle cx={cx} cy={cy} r={active ? 7 : 4.5}
                      fill="#fff" stroke={color} strokeWidth={2.5} />
                    {active && (
                      <text x={cx} y={cy - 12} className="dot-label"
                        textAnchor="middle">
                        {r.id} · {r.temperature.toFixed(1)}℃
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {rows
          .filter((r, i) => i % Math.ceil(rows.length / 6) === 0)
          .map((r) => (
            <text
              key={r.id}
              x={x(new Date(r.sampledAt).getTime())}
              y={H - PAD.bottom + 20}
              className="axis-text"
              textAnchor="middle"
            >
              {r.sampledAt.slice(5, 10)}
            </text>
          ))}
      </svg>

      {hovered && (
        <div className="chart-tip">
          <b>{hovered.id}</b>
          <Badge tone={statusOf(hovered).tone}>{statusOf(hovered).label}</Badge>
          <p>{hovered.species}</p>
          <small>
            {hovered.sampledAt.replace("T", " ")} · {hovered.temperature}℃ ·{" "}
            {hovered.location}
          </small>
        </div>
      )}
    </div>
  );
}
