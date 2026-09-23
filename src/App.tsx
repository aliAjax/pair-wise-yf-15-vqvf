import { useMemo, useState } from "react";
import "./styles.css";
import { STAGES } from "./data/constants";
import {
  resetArchive,
  setClock,
  useArchive,
} from "./store/archive";
import { formatDateTime } from "./rules/signing";
import Workbench, { type StatusFilter } from "./ui/Workbench";
import CaseBatches from "./ui/CaseBatches";
import TemperatureChart from "./ui/TemperatureChart";
import ExaminerPanel from "./ui/ExaminerPanel";
import DetailCard from "./ui/DetailCard";
import NewSpecimenModal from "./ui/NewSpecimenModal";
import { Modal } from "./ui/common";

type Tab = "workbench" | "cases" | "chart" | "examiners";

const TABS: { key: Tab; label: string }[] = [
  { key: "workbench", label: "签发工作台" },
  { key: "cases", label: "案件批次" },
  { key: "chart", label: "温度记录图" },
  { key: "examiners", label: "鉴定人证件" },
];

export default function App() {
  const archive = useArchive();
  const [tab, setTab] = useState<Tab>("workbench");
  const [batchFilter, setBatchFilter] = useState<string | "all">("all");
  const [stageFilter, setStageFilter] = useState<Set<string>>(
    () => new Set(STAGES),
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [clockDraft, setClockDraft] = useState(archive.clock);

  const toggleStage = (stage: string) =>
    setStageFilter((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) {
        if (next.size > 1) next.delete(stage);
      } else next.add(stage);
      return next;
    });

  const metrics = useMemo(() => {
    const list = archive.specimens;
    const avg = list.length
      ? list.reduce((a, s) => a + s.temperature, 0) / list.length
      : 0;
    return [
      { label: "案件批次", value: "3" },
      { label: "检材总数", value: String(list.length) },
      { label: "平均温度", value: `${avg.toFixed(1)}℃` },
      {
        label: "待鉴定",
        value: String(list.filter((s) => s.status === "pending").length),
      },
      {
        label: "待确认",
        value: String(list.filter((s) => s.status === "submitted").length),
      },
      {
        label: "已生效结论",
        value: String(list.filter((s) => s.status === "effective").length),
      },
    ];
  }, [archive.specimens]);

  const pick = (id: string) => setOpenId(id);

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">FORENSIC ENTOMOLOGY · 鉴定签发台</p>
          <h1>法医昆虫检材鉴定签发台</h1>
          <p className="subtitle">
            采样地点 · 环境温度 · 暴露阶段 · 虫种 · 发育阶段 · 采样时刻 ·
            保存方式 · 鉴定备注 —— 结论须授权覆盖虫种且证件有效方可签发
          </p>
        </div>
        <div className="clock-card">
          <small>系统时钟（可前调，验证确认前证件失效）</small>
          <strong>{formatDateTime(archive.clock)}</strong>
          <div className="clock-controls">
            <input
              type="datetime-local"
              value={clockDraft}
              onChange={(e) => setClockDraft(e.target.value)}
            />
            <button
              className="ghost"
              onClick={() => clockDraft && setClock(clockDraft)}
            >
              设置
            </button>
          </div>
          <div className="clock-shortcuts">
            <button
              className="ghost"
              onClick={() => {
                const d = new Date(archive.clock);
                d.setDate(d.getDate() + 10);
                const iso = toLocalInput(d);
                setClockDraft(iso);
                setClock(iso);
              }}
            >
              +10 天
            </button>
            <button className="ghost" onClick={() => {
              const seed = "2026-09-23T09:00";
              setClockDraft(seed);
              setClock(seed);
            }}>
              回到今天
            </button>
            <button
              className="ghost danger"
              onClick={() => {
                if (confirm("恢复预置存档？当前本地改动将被清除。")) {
                  resetArchive();
                  setClockDraft("2026-09-23T09:00");
                  setBatchFilter("all");
                  setStageFilter(new Set(STAGES));
                  setStatusFilter("all");
                }
              }}
            >
              重置存档
            </button>
          </div>
        </div>
      </header>

      <section className="metrics">
        {metrics.map((m) => (
          <article key={m.label}>
            <small>{m.label}</small>
            <strong>{m.value}</strong>
          </article>
        ))}
      </section>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? "active" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
        <button className="primary tab-action" onClick={() => setNewOpen(true)}>
          ＋ 检材入库
        </button>
      </nav>

      {tab === "workbench" && (
        <Workbench
          batchFilter={batchFilter}
          setBatchFilter={setBatchFilter}
          stageFilter={stageFilter}
          toggleStage={toggleStage}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onPick={pick}
        />
      )}

      {tab === "cases" && (
        <CaseBatches
          onPick={pick}
          onFilterBatch={(id) => {
            setBatchFilter(id);
            setTab("workbench");
          }}
        />
      )}

      {tab === "chart" && (
        <section className="panel">
          <div className="heading">
            <div>
              <p className="eyebrow">环境温度 × 采样时刻</p>
              <h2>检材温度记录图</h2>
            </div>
            <span className="muted small">
              沿用签发台的批次与发育阶段筛选
            </span>
          </div>
          <TemperatureChart
            filterBatch={batchFilter}
            filterStages={stageFilter}
            onPick={pick}
          />
        </section>
      )}

      {tab === "examiners" && (
        <section>
          <div className="panel rule-panel">
            <h2>签发规则</h2>
            <ol>
              <li>
                结论只能由<b>授权覆盖该虫种</b>且<b>证件在签发时点有效</b>
                的鉴定人签发；任一项不合，检材<b>退回待鉴定</b>并记录原因。
              </li>
              <li>
                签发后进入<b>待确认</b>，确认时按签发瞬间冻结的证件快照复核：
                证件在确认前已失效的同样退回；<b>已生效结论永久保留</b>，
                不再受证件后续状态影响。
              </li>
            </ol>
          </div>
          <ExaminerPanel />
        </section>
      )}

      <Modal open={openId !== null} onClose={() => setOpenId(null)} wide>
        {openId && <DetailCard specimenId={openId} />}
      </Modal>

      <NewSpecimenModal open={newOpen} onClose={() => setNewOpen(false)} />

      <footer className="foot">
        数据仅保存在本机浏览器 localStorage · 五名鉴定人 / 三个案件批次 /{" "}
        {archive.specimens.length} 份检材 · 规则层、存档层、界面层分离
      </footer>
    </main>
  );
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
