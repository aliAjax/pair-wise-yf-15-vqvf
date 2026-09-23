import { useMemo, useState } from "react";
import "./styles.css";
import { StoreProvider, useStore } from "./store";
import type { Specimen } from "./types";
import BatchListView from "./components/BatchListView";
import CaseLinkView from "./components/CaseLinkView";
import ArchiveView from "./components/ArchiveView";
import DetailDrawer from "./components/DetailDrawer";

type Tab = "batches" | "cases" | "archive";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "batches", label: "批次列表" },
  { key: "cases", label: "案件关联" },
  { key: "archive", label: "签发存档" },
];

function ClockBar() {
  const { clock, setClock, advanceClock, resetAll } = useStore();
  return (
    <div className="clock-bar">
      <label>
        工作台时钟（签发确认时刻）
        <input
          type="datetime-local"
          value={clock}
          onChange={(e) => e.target.value && setClock(e.target.value)}
        />
      </label>
      <button onClick={() => advanceClock(1)}>时钟 +1 天</button>
      <button onClick={() => advanceClock(3)}>+3 天</button>
      <button className="ghost" onClick={resetAll}>
        重置演示数据
      </button>
    </div>
  );
}

function Metrics() {
  const { specimens, batches } = useStore();
  const issued = specimens.filter((s) => s.issuance).length;
  const returned = specimens.filter((s) => s.status === "退回待鉴定").length;
  const pending = specimens.length - issued;
  const avgTemp =
    specimens.reduce((a, s) => a + s.temperature, 0) /
    Math.max(1, specimens.length);
  const stages = new Set(specimens.map((s) => s.stage)).size;

  const cards = [
    { label: "案件批次", value: batches.length, unit: "个" },
    { label: "在档检材", value: specimens.length, unit: "份" },
    { label: "平均采样温度", value: avgTemp.toFixed(1), unit: "℃" },
    { label: "覆盖发育阶段", value: stages, unit: "类" },
    { label: "待鉴定/退回", value: `${pending}（退回${returned}）`, unit: "" },
    { label: "已生效签发", value: issued, unit: "份" },
  ];
  return (
    <section className="metrics">
      {cards.map((c) => (
        <article key={c.label}>
          <small>{c.label}</small>
          <strong>
            {c.value}
            {c.unit && <em> {c.unit}</em>}
          </strong>
        </article>
      ))}
    </section>
  );
}

function Console() {
  const { specimens } = useStore();
  const [tab, setTab] = useState<Tab>("batches");
  const [openId, setOpenId] = useState<string | null>(null);

  const openSpecimen = openId
    ? specimens.find((s) => s.id === openId) ?? null
    : null;

  // 抽屉数据跟随存档更新（签发后即时刷新）
  const handleOpen = (s: Specimen) => setOpenId(s.id);

  const tabs = useMemo(() => TABS, []);

  return (
    <main className="app">
      <header className="hero">
        <p>法医昆虫检材鉴定签发台 · hxyfront-62003</p>
        <h1>法医昆虫检材鉴定签发台</h1>
        <span>
          统一登记采样地点、环境温度、尸体暴露阶段、虫种、发育阶段、采样时刻、保存方式与鉴定备注；
          结论须由授权覆盖该虫种且证件在确认时刻有效的鉴定人签发，任一项不合即退回待鉴定。
        </span>
        <ClockBar />
      </header>

      <Metrics />

      <nav className="tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? "tab active" : "tab"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "batches" && <BatchListView onOpen={handleOpen} />}
      {tab === "cases" && <CaseLinkView onOpen={handleOpen} />}
      {tab === "archive" && <ArchiveView onOpen={handleOpen} />}

      {openSpecimen && (
        <DetailDrawer
          specimen={openSpecimen}
          onClose={() => setOpenId(null)}
        />
      )}

      <footer className="app-foot">
        规则引擎（rules.ts）· 本地存档（store.tsx，localStorage）· 界面（components/）三层分离；
        五名鉴定人、三个案件批次为预置数据。
      </footer>
    </main>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Console />
    </StoreProvider>
  );
}
