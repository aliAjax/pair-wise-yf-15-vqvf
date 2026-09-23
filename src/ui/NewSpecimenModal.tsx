import { useState } from "react";
import {
  EXPOSURE_STAGES,
  PRESERVATIONS,
  SPECIES,
  STAGES,
} from "../data/constants";
import { addSpecimen, listBatches, type ActionResult } from "../store/archive";
import { Modal } from "./common";

/** 新检材入库登记：八项字段齐全后方可提交 */
export default function NewSpecimenModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const batches = listBatches();
  const [form, setForm] = useState({
    batchId: batches[0].id,
    location: "",
    temperature: "25.0",
    exposureStage: EXPOSURE_STAGES[0],
    species: SPECIES[0],
    stage: STAGES[0],
    sampledAt: "2026-09-23T09:00",
    preservation: PRESERVATIONS[0],
    notes: "",
  });
  const [result, setResult] = useState<ActionResult | null>(null);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const temp = Number(form.temperature);
  const valid =
    form.location.trim() !== "" &&
    Number.isFinite(temp) &&
    temp >= -10 &&
    temp <= 50 &&
    form.sampledAt !== "";

  const submit = () => {
    const r = addSpecimen({
      batchId: form.batchId,
      location: form.location.trim(),
      temperature: Math.round(temp * 10) / 10,
      exposureStage: form.exposureStage,
      species: form.species,
      stage: form.stage,
      sampledAt: form.sampledAt,
      preservation: form.preservation,
      notes: form.notes.trim(),
    });
    setResult(r);
    if (r.ok) {
      setForm((f) => ({ ...f, location: "", notes: "" }));
      setTimeout(onClose, 700);
    }
  };

  return (
    <Modal open={open} onClose={onClose} wide>
      <div className="modal-head">
        <h2>新检材入库登记</h2>
        <button className="ghost" onClick={onClose}>
          关闭
        </button>
      </div>
      <div className="field-grid">
        <label>
          <span>所属案件批次</span>
          <select
            value={form.batchId}
            onChange={(e) => set("batchId", e.target.value)}
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.caseNo} · {b.caseName}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>采样时刻</span>
          <input
            type="datetime-local"
            value={form.sampledAt}
            onChange={(e) => set("sampledAt", e.target.value)}
          />
        </label>
        <label className="span-2">
          <span>采样地点</span>
          <input
            placeholder="如：林缘排水沟北岸腐殖土表层"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
          />
        </label>
        <label>
          <span>环境温度（℃）</span>
          <input
            type="number"
            step="0.1"
            min="-10"
            max="50"
            value={form.temperature}
            onChange={(e) => set("temperature", e.target.value)}
          />
        </label>
        <label>
          <span>暴露阶段</span>
          <select
            value={form.exposureStage}
            onChange={(e) => set("exposureStage", e.target.value)}
          >
            {EXPOSURE_STAGES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          <span>虫种</span>
          <select
            value={form.species}
            onChange={(e) => set("species", e.target.value)}
          >
            {SPECIES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          <span>发育阶段</span>
          <select
            value={form.stage}
            onChange={(e) => set("stage", e.target.value)}
          >
            {STAGES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="span-2">
          <span>保存方式</span>
          <select
            value={form.preservation}
            onChange={(e) => set("preservation", e.target.value)}
          >
            {PRESERVATIONS.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="span-2">
          <span>鉴定备注</span>
          <textarea
            rows={2}
            placeholder="孳生情况、数量、体长、特殊现象等"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </label>
      </div>
      {result && (
        <div className={`result ${result.ok ? "ok" : "bad"}`}>
          {result.message}
        </div>
      )}
      <div className="row-end">
        <button className="primary" disabled={!valid} onClick={submit}>
          登记入库
        </button>
      </div>
    </Modal>
  );
}
