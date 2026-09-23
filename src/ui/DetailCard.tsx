import { useMemo, useState } from "react";
import {
  confirmConclusion,
  getBatch,
  listExaminers,
  signConclusion,
  updateNotes,
  useArchive,
  withdrawSubmission,
  type ActionResult,
} from "../store/archive";
import {
  credentialState,
  formatDate,
  formatDateTime,
  isAuthorizedFor,
  isCredentialValidAt,
} from "../rules/signing";
import type { SpecimenEvent } from "../types";
import { Badge, statusOf } from "./common";

const EVENT_LABEL: Record<SpecimenEvent["kind"], string> = {
  created: "入库",
  submitted: "签发",
  effective: "生效",
  returned: "退回",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="kv">
      <dt>{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

export default function DetailCard({ specimenId }: { specimenId: string }) {
  const archive = useArchive();
  const specimen = archive.specimens.find((s) => s.id === specimenId);
  const [examinerId, setExaminerId] = useState("E01");
  const [conclusion, setConclusion] = useState("");
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);

  const examiners = listExaminers();
  const examiner = useMemo(
    () => examiners.find((e) => e.id === examinerId) ?? examiners[0],
    [examinerId, examiners],
  );

  if (!specimen) return <p className="empty">未找到检材。</p>;

  const batch = getBatch(specimen.batchId);
  const st = statusOf(specimen);
  const preview = (() => {
    const authorized = isAuthorizedFor(examiner, specimen.species);
    const valid = isCredentialValidAt(examiner.credential, archive.clock);
    return { authorized, valid, passable: authorized && valid };
  })();
  const credState = credentialState(examiner.credential, archive.clock);

  const run = (r: ActionResult) => setResult(r);

  return (
    <div className="detail">
      <div className="detail-head">
        <div>
          <p className="eyebrow">{batch?.caseNo} · {batch?.caseName}</p>
          <h2>
            检材 {specimen.id} <Badge tone={st.tone}>{st.label}</Badge>
          </h2>
        </div>
      </div>

      <dl className="kv-grid">
        <Field label="采样地点" value={specimen.location} />
        <Field label="环境温度" value={`${specimen.temperature.toFixed(1)} ℃`} />
        <Field label="暴露阶段" value={specimen.exposureStage} />
        <Field label="虫种" value={specimen.species} />
        <Field label="发育阶段" value={specimen.stage} />
        <Field label="采样时刻" value={formatDateTime(specimen.sampledAt)} />
        <Field label="保存方式" value={specimen.preservation} />
        <Field label="当前鉴定人" value={specimen.effective?.examinerName ?? specimen.signed?.examinerName ?? "尚未签发"} />
      </dl>

      <div className="block">
        <h3>鉴定备注</h3>
        {notesDraft === null ? (
          <div className="notes-box">
            <p>{specimen.notes || "无"}</p>
            {specimen.status !== "effective" && (
              <button
                className="ghost"
                onClick={() => setNotesDraft(specimen.notes)}
              >
                编辑备注
              </button>
            )}
          </div>
        ) : (
          <div className="notes-edit">
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={3}
            />
            <div className="row-end">
              <button className="ghost" onClick={() => setNotesDraft(null)}>
                取消
              </button>
              <button
                className="primary"
                onClick={() => {
                  run(updateNotes(specimen.id, notesDraft.trim()));
                  setNotesDraft(null);
                }}
              >
                保存备注
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 待鉴定：选择鉴定人并签发，资格实时预检 */}
      {specimen.status === "pending" && (
        <div className="block sign-box">
          <h3>签发结论</h3>
          <label className="full">
            <span>选择鉴定人</span>
            <select
              value={examinerId}
              onChange={(e) => {
                setExaminerId(e.target.value);
                setResult(null);
              }}
            >
              {examiners.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.title} · {e.org}
                </option>
              ))}
            </select>
          </label>

          <div className="precheck">
            <div>
              <small>证件 {examiner.credential.number}</small>
              <p>
                有效期 {examiner.credential.validFrom} ~{" "}
                {examiner.credential.validUntil}
                <Badge tone={credState.tone}>{credState.label}</Badge>
              </p>
            </div>
            <div>
              <small>虫种授权</small>
              <p>
                {preview.authorized ? "授权覆盖该虫种" : "未授权该虫种"}
                <Badge tone={preview.authorized ? "ok" : "bad"}>
                  {preview.authorized ? "覆盖" : "越权"}
                </Badge>
              </p>
            </div>
          </div>
          <ul className="scope-list">
            {examiner.authorizedSpecies.map((sp) => (
              <li
                key={sp}
                className={sp === specimen.species ? "scope-hit" : ""}
              >
                {sp}
              </li>
            ))}
          </ul>

          <label className="full">
            <span>鉴定结论</span>
            <textarea
              rows={3}
              placeholder="填写虫种鉴定意见与死亡时间推断依据……"
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
            />
          </label>

          <div className="row-end">
            <button
              className="primary"
              disabled={!conclusion.trim()}
              onClick={() =>
                run(signConclusion(specimen.id, examinerId, conclusion.trim()))
              }
            >
              {preview.passable ? "提交签发" : "尝试签发（将退回）"}
            </button>
          </div>
          {!preview.passable && (
            <p className="hint bad">
              预检不通过：
              {!preview.authorized && " 授权不覆盖该虫种；"}
              {!preview.valid &&
                ` 证件当前${credState.label}（${examiner.credential.validUntil} 到期）；`}
              提交后检材将退回待鉴定并留痕。
            </p>
          )}
        </div>
      )}

      {/* 待确认：按签发时冻结的证件快照复核 */}
      {specimen.status === "submitted" && specimen.signed && (
        <div className="block submitted-box">
          <h3>待授权确认</h3>
          <div className="signed-meta">
            <p>
              <b>{specimen.signed.examinerName}</b> 于{" "}
              {formatDateTime(specimen.signed.signedAt)} 签发
            </p>
            <p className="conclusion-text">{specimen.signed.conclusion}</p>
            <div className="snapshot">
              <p>
                证件快照 {specimen.signed.credentialSnapshot.number}（
                {specimen.signed.credentialSnapshot.validFrom} ~{" "}
                {specimen.signed.credentialSnapshot.validUntil}）
              </p>
              <p>
                确认只认签发时冻结的快照；当前系统时钟为{" "}
                <b>{formatDateTime(archive.clock)}</b>
              </p>
              {(() => {
                const snap = specimen.signed!.credentialSnapshot;
                const stillValid =
                  archive.clock.slice(0, 10) <= snap.validUntil &&
                  archive.clock.slice(0, 10) >= snap.validFrom;
                return (
                  <Badge tone={stillValid ? "ok" : "bad"}>
                    {stillValid
                      ? "快照证件仍有效，可确认生效"
                      : "快照证件在确认前已失效，确认将退回"}
                  </Badge>
                );
              })()}
            </div>
          </div>
          <div className="row-end gap">
            <button
              className="ghost"
              onClick={() => run(withdrawSubmission(specimen.id))}
            >
              撤回签发
            </button>
            <button
              className="primary"
              onClick={() => run(confirmConclusion(specimen.id))}
            >
              确认生效
            </button>
          </div>
        </div>
      )}

      {/* 已生效：永久保留 */}
      {specimen.status === "effective" && specimen.effective && (
        <div className="block effective-box">
          <h3>生效结论（已归档，永久保留）</h3>
          <p className="conclusion-text">{specimen.effective.conclusion}</p>
          <p className="muted">
            签发：{specimen.effective.examinerName} ·{" "}
            {formatDateTime(specimen.effective.signedAt)}　｜　确认生效：{" "}
            {formatDateTime(specimen.effective.confirmedAt)}
          </p>
          <p className="muted">
            归档证件 {specimen.effective.credentialSnapshot.number}
            （{specimen.effective.credentialSnapshot.validFrom} ~{" "}
            {formatDate(specimen.effective.credentialSnapshot.validUntil)}
            ）；证件日后失效不影响本结论效力。
          </p>
        </div>
      )}

      {result && (
        <div className={`result ${result.ok ? "ok" : "bad"}`}>
          {result.message}
        </div>
      )}

      <div className="block">
        <h3>流转轨迹</h3>
        <ol className="timeline">
          {specimen.events.map((ev, i) => (
            <li key={i} className={`tl tl-${ev.kind}`}>
              <span className="tl-tag">{EVENT_LABEL[ev.kind]}</span>
              <div>
                <p>{ev.detail}</p>
                <small>
                  {formatDateTime(ev.at)}
                  {ev.actorName ? ` · ${ev.actorName}` : ""}
                </small>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
