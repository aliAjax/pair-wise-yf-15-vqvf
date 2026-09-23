import { EXAMINERS, SPECIES } from "../data/constants";
import { credentialState } from "../rules/signing";
import { useArchive } from "../store/archive";
import { Badge } from "./common";

/** 鉴定人证件与授权范围面板（只读档案，随系统时钟显示有效状态） */
export default function ExaminerPanel() {
  const { clock, specimens } = useArchive();

  return (
    <div className="examiner-grid">
      {EXAMINERS.map((e) => {
        const state = credentialState(e.credential, clock);
        const signedCount = specimens.filter(
          (s) =>
            s.effective?.examinerId === e.id ||
            (s.status === "submitted" && s.signed?.examinerId === e.id),
        ).length;
        return (
          <article key={e.id} className={`examiner-card tone-${state.tone}`}>
            <header>
              <div>
                <h3>
                  {e.name} <small>{e.title}</small>
                </h3>
                <p className="muted">
                  {e.org} · 工号 {e.id}
                </p>
              </div>
              <Badge tone={state.tone}>{state.label}</Badge>
            </header>
            <p className="cred-line">
              证件 {e.credential.number}
              <br />
              {e.credential.validFrom} 至 {e.credential.validUntil}
            </p>
            <div className="auth-matrix">
              {SPECIES.map((sp) => {
                const hit = e.authorizedSpecies.includes(sp);
                return (
                  <span key={sp} className={hit ? "auth-on" : "auth-off"}>
                    {hit ? "✓" : "—"} {sp.split(" ")[0]}
                  </span>
                );
              })}
            </div>
            <p className="muted small">在办 / 已签发检材：{signedCount} 份</p>
          </article>
        );
      })}
    </div>
  );
}
