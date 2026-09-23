import type { SpecimenStatus, Stage } from "../types";
import { STAGES } from "../data";

export const STATUS_META: Record<
  SpecimenStatus,
  { label: string; cls: string }
> = {
  待鉴定: { label: "待鉴定", cls: "st-pending" },
  已签发: { label: "已签发", cls: "st-issued" },
  退回待鉴定: { label: "退回待鉴定", cls: "st-returned" },
};

export function StatusBadge({ status }: { status: SpecimenStatus }) {
  const m = STATUS_META[status];
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

export const ALL_STAGE_FILTER = "全部阶段";

/** 发育阶段筛选条：批次列表与案件关联共用 */
export function StageFilter({
  value,
  onChange,
  counts,
}: {
  value: Stage | typeof ALL_STAGE_FILTER;
  onChange: (v: Stage | typeof ALL_STAGE_FILTER) => void;
  counts?: Record<string, number>;
}) {
  const options: string[] = [ALL_STAGE_FILTER, ...STAGES];
  return (
    <div className="stage-filter" role="tablist" aria-label="发育阶段筛选">
      {options.map((s) => {
        const active = s === value;
        const n = counts?.[s];
        return (
          <button
            key={s}
            className={active ? "chip active" : "chip"}
            aria-pressed={active}
            onClick={() => onChange(s as Stage | typeof ALL_STAGE_FILTER)}
          >
            {s}
            {n !== undefined && <em className="chip-count">{n}</em>}
          </button>
        );
      })}
    </div>
  );
}
