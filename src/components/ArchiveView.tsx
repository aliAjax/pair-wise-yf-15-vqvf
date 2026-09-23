import { SPECIES } from "../data";
import { certStateAt } from "../rules";
import type { Specimen } from "../types";
import { useStore } from "../store";

export default function ArchiveView({
  onOpen,
}: {
  onOpen: (s: Specimen) => void;
}) {
  const { specimens, batches, examiners, clock } = useStore();
  const issued = specimens.filter((s) => s.issuance?.locked);

  return (
    <div className="view">
      <section className="panel">
        <h3>鉴定人名册与授权目录</h3>
        <p className="muted">
          工作台时钟：<b>{clock.replace("T", " ")}</b>；证件状态随该时钟实时判定，
          但已生效签发不受后续到期影响。
        </p>
        <div className="roster">
          {examiners.map((ex) => {
            const state = certStateAt(ex, clock);
            return (
              <article key={ex.id} className="roster-card">
                <header>
                  <b>{ex.name}</b>
                  <span
                    className={
                      "mini-badge " +
                      (state === "有效"
                        ? "cert-ok"
                        : state === "今日到期"
                          ? "cert-warn"
                          : "cert-bad")
                    }
                  >
                    {state}
                  </span>
                </header>
                <small>{ex.title}</small>
                <small>
                  {ex.certNo}（{ex.validFrom} ~ {ex.validUntil}）
                </small>
                <div className="auth-chips">
                  {ex.species.map((code) => (
                    <span key={code} className="auth-chip">
                      {SPECIES[code].split(" ")[0]}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h3>
          已生效签发存档
          <em className="count-em">{issued.length} 份证书</em>
        </h3>
        {issued.length === 0 ? (
          <p className="muted">
            尚无生效签发。请在批次列表或案件关联中打开检材完成合规签发。
          </p>
        ) : (
          <div className="certs">
            {issued.map((s) => {
              const batch = batches.find((b) => b.id === s.batchId);
              const iss = s.issuance!;
              const nowState = certStateAt(
                examiners.find((e) => e.id === iss.examinerId)!,
                clock
              );
              return (
                <button
                  key={s.id}
                  className="cert-card"
                  onClick={() => onOpen(s)}
                >
                  <div className="cert-no">{iss.certificateNo}</div>
                  <h4>{batch?.name}</h4>
                  <p>
                    检材 {s.sampleNo} · {SPECIES[s.species].split(" ")[0]} ·{" "}
                    {s.stage}
                  </p>
                  <p className="conclusion-text">
                    【{iss.kind}】{iss.conclusion}
                  </p>
                  <footer>
                    <span>签发人：{iss.examinerName}</span>
                    <span>{iss.issuedAt.replace("T", " ")}</span>
                  </footer>
                  {nowState === "已失效" && (
                    <div className="retain-note">
                      证件现已{nowState}——签发时有效，结论保留
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
