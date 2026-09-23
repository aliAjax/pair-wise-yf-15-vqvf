import type { ReactNode } from "react";
import type { Specimen } from "../types";

export type Tone = "ok" | "warn" | "info" | "bad" | "muted";

export function statusOf(s: Specimen): {
  label: string;
  tone: Tone;
  returned: boolean;
} {
  const returned = s.events.some((e) => e.kind === "returned");
  if (s.status === "effective")
    return { label: "已生效", tone: "ok", returned: false };
  if (s.status === "submitted")
    return { label: "待确认", tone: "info", returned: false };
  return {
    label: returned ? "待鉴定 · 退回" : "待鉴定",
    tone: returned ? "bad" : "warn",
    returned,
  };
}

export function Badge({
  tone,
  children,
}: {
  tone: Tone;
  children: ReactNode;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

const TONE_TEXT: Record<Tone, string> = {
  ok: "有效",
  warn: "临近",
  info: "提示",
  bad: "失效",
  muted: "—",
};

export function Modal({
  open,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="modal-mask" onMouseDown={onClose}>
      <div
        className={`modal ${wide ? "modal-wide" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export { TONE_TEXT };
