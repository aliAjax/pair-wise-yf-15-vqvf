import type { TempPoint } from "../types";

/** 批次环境温度记录图（纯 SVG，数据来自共享存档） */
export default function TempChart({
  points,
  height = 220,
}: {
  points: TempPoint[];
  height?: number;
}) {
  const W = 720;
  const H = height;
  const padL = 44;
  const padR = 16;
  const padT = 18;
  const padB = 46;

  const temps = points.map((p) => p.temp);
  const min = Math.floor(Math.min(...temps) - 1.5);
  const max = Math.ceil(Math.max(...temps) + 1.5);
  const span = Math.max(1, max - min);

  const x = (i: number) =>
    padL + (i * (W - padL - padR)) / Math.max(1, points.length - 1);
  const y = (t: number) =>
    padT + (1 - (t - min) / span) * (H - padT - padB);

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.temp).toFixed(1)}`)
    .join(" ");
  const area =
    `${line} L ${x(points.length - 1).toFixed(1)} ${H - padB} ` +
    `L ${x(0).toFixed(1)} ${H - padB} Z`;

  const gridTemps: number[] = [];
  const steps = 4;
  for (let i = 0; i <= steps; i++) gridTemps.push(min + (span * i) / steps);

  const labelStep = Math.ceil(points.length / 6);

  return (
    <svg
      className="temp-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="环境温度记录图"
    >
      {gridTemps.map((t) => (
        <g key={t.toFixed(1)}>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(t)}
            y2={y(t)}
            className="grid-line"
          />
          <text x={padL - 8} y={y(t) + 4} className="axis-label" textAnchor="end">
            {t.toFixed(0)}℃
          </text>
        </g>
      ))}

      <path d={area} className="temp-area" />
      <path d={line} className="temp-line" />

      {points.map((p, i) => (
        <g key={p.t}>
          <circle
            cx={x(i)}
            cy={y(p.temp)}
            r={p.sampled ? 5 : 3.5}
            className={p.sampled ? "dot dot-sampled" : "dot"}
          />
          {p.sampled && (
            <text x={x(i)} y={y(p.temp) - 10} className="temp-value" textAnchor="middle">
              {p.temp.toFixed(1)}
            </text>
          )}
          {i % labelStep === 0 && (
            <text
              x={x(i)}
              y={H - padB + 18}
              className="axis-label time-label"
              textAnchor="middle"
            >
              {p.t.slice(5)}
            </text>
          )}
        </g>
      ))}

      <g className="legend">
        <circle cx={padL + 6} cy={H - 8} r={4} className="dot dot-sampled" />
        <text x={padL + 16} y={H - 4} className="axis-label">
          采样实测点
        </text>
      </g>
    </svg>
  );
}
