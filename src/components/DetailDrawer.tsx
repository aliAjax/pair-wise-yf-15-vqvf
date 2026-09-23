import { useEffect, useMemo, useState } from "react";
import {
  EXPOSURES,
  PRESERVATIONS,
  SPECIES,
  STAGES,
} from "../data";
import { certStateAt, evaluateSign } from "../rules";
import type { ConclusionKind, Specimen } from "../types";
import { useStore } from "../store";
import { StatusBadge } from "./Filters";

const KINDS: ConclusionKind[] = [
  "死亡时间推断",
  "死亡地点推断",
  "死后移动证据",
  "毒物检材支持",
];

const CERT_BADGE: Record<string, string> = {
  有效: "cert-ok",
  今日到期: "cert-warn",
  已失效: "cert-bad",
  未生效: "cert-bad",
};

export default function DetailDrawer({
  specimen,
  onClose,
}: {
  specimen: Specimen;
  onClose: () => void;
}) {
  const { batches, examiners, clock, sign, updateSpecimen } = useStore();
  const batch = batches.find((b) => b.id === specimen.batchId);
  const locked = specimen.issuance?.locked === true;

  const [examinerId, setExaminerId] = useState("");
  const [kind, setKind] = useState<ConclusionKind | "">("");
  const [conclusion, setConclusion] = useState("");
  const [flash, setFlash] = useState<
    { ok: boolean; text: string[] } | null
  >(null);

  useEffect(() => {
    setFlash(null);
  }, [specimen.id, examinerId, kind, conclusion]);

  // 预检：不改变状态，只依据当前时钟给出规则结果
  const precheck = useMemo(
    () =>
      evaluateSign({
        specimen,
        examiner: examiners.find((e) => e.id === examinerId),
        kind,
        conclusion,
        clock,
      }),
    [specimen, examiners, examinerId, kind, conclusion, clock]
  );

  const handleConfirm = () => {
    const r = sign({ specimenId: specimen.id, examinerId, kind, conclusion });
    setFlash({ ok: r.ok, text: r.ok ? ["签发成功，结论已归档锁定。"] : r.reasons });
  };

  return (
    <div className="drawer-mask" onClick={onClose}>
      <aside
        className="drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label="检材详情与签发台"
      >
        <header className="drawer-head">
          <div>
            <p className="eyebrow">{batch?.caseNo} · {batch?.name}</p>
            <h2>检材 {specimen.sampleNo}</h2>
            <StatusBadge status={specimen.status} />
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </header>

        <div className="drawer-body">
          {/* 已生效签发：保留锁定 */}
          {locked && specimen.issuance && (
            <section className="panel locked-card">
              <h3>已生效签发（归档锁定）</h3>
              <dl className="kv">
                <dt>证书编号</dt>
                <dd>{specimen.issuance.certificateNo}</dd>
                <dt>签发人</dt>
                <dd>
                  {specimen.issuance.examinerName}（{specimen.issuance.certNo}）
                </dd>
                <dt>确认时刻</dt>
                <dd>{specimen.issuance.issuedAt.replace("T", " ")}</dd>
                <dt>签发时证件有效期</dt>
                <dd>
                  {specimen.issuance.certValidFrom} ~{" "}
                  {specimen.issuance.certValidUntil}
                </dd>
                <dt>结论类型</dt>
                <dd>{specimen.issuance.kind}</dd>
                <dt>鉴定结论</dt>
                <dd className="conclusion-text">
                  {specimen.issuance.conclusion}
                </dd>
              </dl>
              <p className="lock-note">
                该结论经合规确认后已生效；此后即使证件到期失效，结论仍保留有效。
              </p>
            </section>
          )}

          {/* 检材信息 */}
          <section className="panel">
            <h3>检材信息</h3>
            <div className="field-grid form-grid">
              <label className="span-2">
                <span>采样地点</span>
                <input
                  value={specimen.location}
                  disabled={locked}
                  onChange={(e) =>
                    updateSpecimen(specimen.id, { location: e.target.value })
                  }
                />
              </label>
              <label>
                <span>环境温度（℃）</span>
                <input
                  type="number"
                  step="0.1"
                  value={specimen.temperature}
                  disabled={locked}
                  onChange={(e) =>
                    updateSpecimen(specimen.id, {
                      temperature: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                <span>采样时刻</span>
                <input
                  type="datetime-local"
                  value={specimen.sampledAt}
                  disabled={locked}
                  onChange={(e) =>
                    updateSpecimen(specimen.id, { sampledAt: e.target.value })
                  }
                />
              </label>
              <label>
                <span>暴露阶段</span>
                <select
                  value={specimen.exposure}
                  disabled={locked}
                  onChange={(e) =>
                    updateSpecimen(specimen.id, {
                      exposure: e.target.value as Specimen["exposure"],
                    })
                  }
                >
                  {EXPOSURES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>发育阶段</span>
                <select
                  value={specimen.stage}
                  disabled={locked}
                  onChange={(e) =>
                    updateSpecimen(specimen.id, {
                      stage: e.target.value as Specimen["stage"],
                    })
                  }
                >
                  {STAGES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>虫种</span>
                <select
                  value={specimen.species}
                  disabled={locked}
                  onChange={(e) =>
                    updateSpecimen(specimen.id, {
                      species: e.target.value as Specimen["species"],
                    })
                  }
                >
                  {Object.entries(SPECIES).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>保存方式</span>
                <select
                  value={specimen.preservation}
                  disabled={locked}
                  onChange={(e) =>
                    updateSpecimen(specimen.id, {
                      preservation:
                        e.target.value as Specimen["preservation"],
                    })
                  }
                >
                  {PRESERVATIONS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="span-2">
                <span>鉴定备注</span>
                <textarea
                  rows={2}
                  value={specimen.remark}
                  disabled={locked}
                  onChange={(e) =>
                    updateSpecimen(specimen.id, { remark: e.target.value })
                  }
                />
              </label>
            </div>
          </section>

          {/* 签发台 */}
          {!locked && (
            <section className="panel sign-panel">
              <h3>签发确认台</h3>
              <p className="muted">
                规则：鉴定人授权须覆盖该虫种，且证件在确认时刻（
                <b>{clock.replace("T", " ")}</b>）有效；任一项不合将退回待鉴定。
              </p>

              <div className="examiner-list">
                {examiners.map((ex) => {
                  const state = certStateAt(ex, clock);
                  const covered = ex.species.includes(specimen.species);
                  return (
                    <button
                      key={ex.id}
                      className={
                        "examiner-card" +
                        (examinerId === ex.id ? " selected" : "")
                      }
                      onClick={() => setExaminerId(ex.id)}
                    >
                      <span className="examiner-main">
                        <b>{ex.name}</b>
                        <small>{ex.title}</small>
                        <small>
                          {ex.certNo} · {ex.validFrom} ~ {ex.validUntil}
                        </small>
                        <small className="auth-line">
                          授权虫种：
                          {ex.species.map((c) => SPECIES[c].split(" ")[0]).join("、")}
                        </small>
                      </span>
                      <span className="examiner-tags">
                        <span className={`mini-badge ${CERT_BADGE[state]}`}>
                          证件{state}
                        </span>
                        <span
                          className={`mini-badge ${
                            covered ? "cert-ok" : "cert-bad"
                          }`}
                        >
                          {covered ? "覆盖本虫种" : "不覆盖本虫种"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="field-grid form-grid">
                <label>
                  <span>结论类型</span>
                  <select
                    value={kind}
                    onChange={(e) =>
                      setKind(e.target.value as ConclusionKind)
                    }
                  >
                    <option value="">请选择</option>
                    {KINDS.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </label>
                <label className="span-2">
                  <span>鉴定结论</span>
                  <textarea
                    rows={3}
                    placeholder="填写拟随证书归档的结论文本"
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                  />
                </label>
              </div>

              {/* 预检结果 */}
              <div
                className={
                  "precheck " + (precheck.ok ? "pre-ok" : "pre-bad")
                }
              >
                <b>{precheck.ok ? "预检通过，可确认签发" : "预检不合规，确认后将退回待鉴定"}</b>
                <ul>
                  {(precheck.ok
                    ? ["虫种授权覆盖、证件当前有效、检材字段与结论齐备。"]
                    : precheck.reasons
                  ).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="drawer-actions">
                <button className="primary" onClick={handleConfirm}>
                  提交签发确认
                </button>
                <span className="muted small">
                  不合规的确认会被记录为一次退回尝试，状态置为「退回待鉴定」
                </span>
              </div>

              {flash && (
                <div
                  className={
                    "flash " + (flash.ok ? "flash-ok" : "flash-bad")
                  }
                >
                  <b>{flash.ok ? "✓ 已签发归档" : "↩ 已退回待鉴定"}</b>
                  <ul>
                    {flash.text.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* 尝试记录 */}
          <section className="panel">
            <h3>签发尝试记录（{specimen.attempts.length}）</h3>
            {specimen.attempts.length === 0 ? (
              <p className="muted">暂无签发尝试。</p>
            ) : (
              <ol className="attempts">
                {specimen.attempts.map((a, i) => (
                  <li key={i} className={a.ok ? "att-ok" : "att-bad"}>
                    <div>
                      <b>
                        {a.ok ? "签发成功" : "退回"} · {a.examinerName}
                      </b>
                      <time>
                        操作 {a.at.replace("T", " ")} ｜ 工作台时钟{" "}
                        {a.clock.replace("T", " ")}
                      </time>
                    </div>
                    {!a.ok && (
                      <ul>
                        {a.reasons.map((r, j) => (
                          <li key={j}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
