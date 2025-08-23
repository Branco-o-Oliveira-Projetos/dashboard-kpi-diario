import { useEffect, useMemo, useState } from "react";

import Logo from "./image/logo.png";

import StatusBar from "./components/StatusBar";
import KpiCard from "./components/KpiCard";
import { SYSTEM_ORDER, SYSTEMS } from "./lib/systems";
import type { SystemKey } from "./types";

const CARDS_PER_PAGE = 4;

function App() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => setCycle((c) => c + 1), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const systems = SYSTEM_ORDER;
  const numPages = Math.max(1, Math.ceil(systems.length / CARDS_PER_PAGE));

  // carrossel a cada 5s
  useEffect(() => {
    const id = setInterval(() => setPage((p) => (p + 1) % numPages), 5000);
    return () => clearInterval(id);
  }, [numPages]);

  const start = page * CARDS_PER_PAGE;
  const pageSystems = systems.slice(start, start + CARDS_PER_PAGE);

  const grid = useMemo(
    () => [pageSystems.slice(0, 2), pageSystems.slice(2, 4)],
    [pageSystems]
  );

  return (
    <div className="max-w-[1280px] mx-auto p-3 md:p-4">
      <div className="flex items-center gap-2 mb-2">
        <img src={Logo} alt="B&O" className="h-8" onError={() => {}} />
        <div className="flex-1" />
        <h2 className="font-semibold text-lg text-center flex-1">
          Dashboard com dados diários
        </h2>
        <div className="flex-1" />
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh
        </label>
      </div>

      <StatusBar cycle={cycle} />

      {grid.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3"
        >
          {row.map((key: SystemKey) => {
            const def = SYSTEMS[key];
            return (
              <KpiCard
                key={key}
                system={key}
                title={def.title}
                labels={def.labels}
                chartType={def.chartType}
                autoRefreshMs={autoRefresh ? 10 * 60 * 1000 : false}
              />
            );
          })}
        </div>
      ))}

      {numPages > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={numPages - 1}
            value={page}
            onChange={(e) => setPage(parseInt(e.target.value))}
            className="w-64"
          />
          <span className="text-sm text-text2">
            Página {page + 1} / {numPages}
          </span>
        </div>
      )}

      <footer className="mt-6 text-sm text-text2 flex justify-end">
        © 2025 B&O - Todos os direitos reservados
      </footer>
    </div>
  );
}

export default App;
