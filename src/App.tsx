import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import StatusBar from "./components/StatusBar";
import KpiCard from "./components/KpiCard";
import { SYSTEM_ORDER, SYSTEMS } from "./lib/systems";
import type { SystemKey } from "./types";

// Logo da empresa
const Logo = "https://s3.automacoesbeo.xyz/logos-empresas/Grupo_B_O.png";

// Quantidade de cards por página do carrossel
const CARDS_PER_PAGE = 3; // Aumentado para melhor uso do espaço

function App() {
  // Estado para controle do auto-refresh dos dados
  const [autoRefresh, setAutoRefresh] = useState(true);
  // Estado para controle do ciclo de atualização
  const [cycle, setCycle] = useState(0);
  // Estado para controle da página do carrossel
  const [page, setPage] = useState(0);

  // Efeito para atualizar o ciclo a cada 3 minutos se autoRefresh estiver ativo
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => setCycle((c) => c + 1), 3 * 60 * 1000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  // Lista dos sistemas definidos
  const systems = SYSTEM_ORDER;
  // Calcula o número total de páginas do carrossel
  const numPages = Math.max(1, Math.ceil(systems.length / CARDS_PER_PAGE));

  // Efeito para avançar o carrossel a cada 15 segundos
  useEffect(() => {
    const id = setInterval(() => setPage((p) => (p + 1) % numPages), 15000);
    return () => clearInterval(id);
  }, [numPages]);

  // Calcula o índice inicial dos sistemas da página atual
  const start = page * CARDS_PER_PAGE;
  // Seleciona os sistemas da página atual
  const pageSystems = systems.slice(start, start + CARDS_PER_PAGE);

  // Organiza os sistemas em layout responsivo para o grid
  const grid = useMemo(() => {
    if (pageSystems.length <= 3) {
      return [pageSystems]; // Uma linha para 1-3 cards
    } else if (pageSystems.length <= 4) {
      return [pageSystems.slice(0, 2), pageSystems.slice(2, 4)]; // Duas linhas para 4-5 cards
    } else {
      return [
        pageSystems.slice(0, 3), 
        pageSystems.slice(3, 6)
      ]; // Duas linhas para 5-6 cards
    }
  }, [pageSystems]);

  return (
    <div className="min-h-screen w-full mx-auto px-4 py-6 max-w-full">
      {/* Barra superior com logo, título e auto-refresh */}
      <motion.div 
        className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mb-4 sm:mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.img 
          src={Logo} 
          alt="B&O" 
          className="h-8 sm:h-10" 
          onError={() => {}}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        <div className="flex-1" />
        <motion.h2 
          className="font-semibold text-lg sm:text-xl lg:text-2xl text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Dashboard com dados diários
        </motion.h2>
        <div className="flex-1" />
        <motion.label 
          className="text-sm flex items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="accent-primary"
          />
          Auto-refresh
        </motion.label>
      </motion.div>

      {/* Barra de status com data/hora e ciclo */}
      <StatusBar cycle={cycle} />

      {/* Renderiza os cards dos KPIs em grid responsivo */}
      {grid.map((row, i) => (
        <motion.div
          key={i}
          className={`grid gap-3 sm:gap-4 lg:gap-6 mb-3 sm:mb-4 lg:mb-6 ${
            row.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
            row.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: i * 0.1 }}
        >
          {row.map((key: SystemKey, cardIndex) => {
            const def = SYSTEMS[key];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: (i * 0.1) + (cardIndex * 0.05),
                  type: "spring",
                  stiffness: 100 
                }}
                whileHover={{ 
                  y: -5, 
                  scale: 1.02,
                  transition: { duration: 0.2 } 
                }}
              >
                <KpiCard
                  system={key}
                  title={def.title}
                  labels={def.labels}
                  chartType={def.chartType}
                  autoRefreshMs={autoRefresh ? 3 * 60 * 1000 : false}
                />
              </motion.div>
            );
          })}
        </motion.div>
      ))}

      {/* Controle do carrossel de páginas */}
      {numPages > 1 && (
        <motion.div 
          className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.input
            type="range"
            min={0}
            max={numPages - 1}
            value={page}
            onChange={(e) => setPage(parseInt(e.target.value))}
            className="w-full sm:w-64 accent-primary"
            whileHover={{ scale: 1.02 }}
          />
          <motion.span 
            className="text-sm text-text2 whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            Página {page + 1} / {numPages}
          </motion.span>
        </motion.div>
      )}

      {/* Rodapé */}
      <motion.footer 
        className="mt-6 sm:mt-8 text-xs sm:text-sm text-text2 flex justify-center sm:justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        © 2025 B&O - Todos os direitos reservados
      </motion.footer>
    </div>
  );
}

export default App;
