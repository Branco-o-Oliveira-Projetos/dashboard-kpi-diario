import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { fetchKpis, fetchSeries } from '../lib/api'
import { fmtNum, fmtMoney } from '../lib/format'
import type { SystemKey, ChartType } from '../types'

interface KpiCardProps {
  system: SystemKey
  title: string
  labels: string[]
  chartType: ChartType
  autoRefreshMs: number | false
}

function Metric({ label, value, isMoney }: { label: string; value: number | null; isMoney?: boolean }) {
  return (
    <motion.div 
      className="text-center p-1 sm:p-2 bg-white/5 border border-white/10 rounded-lg shadow-inner shadow-black/40"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <motion.div 
        className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-neonAqua"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.6,
          type: "spring",
          stiffness: 200 
        }}
      >
        {isMoney ? fmtMoney(value) : fmtNum(value)}
      </motion.div>
      <div className="text-xs sm:text-xs md:text-xs lg:text-sm text-text2 mt-1 leading-tight break-words overflow-hidden">
        {label}
      </div>
    </motion.div>
  )
}

export default function KpiCard({
  system,
  title,
  labels,
  chartType,
  autoRefreshMs,
}: KpiCardProps) {
  const kpisQ = useQuery({
    queryKey: ['kpis', system],
    queryFn: () => fetchKpis(system),
    refetchInterval: autoRefreshMs || false,
  })

  const seriesQ = useQuery({
    queryKey: ['series', system],
    queryFn: () => fetchSeries(system),
    refetchInterval: autoRefreshMs || false,
  })

  const k = kpisQ.data?.values || []
  const points = seriesQ.data?.points || []

  return (
    <motion.div
      className="card h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ 
        y: -5, 
        boxShadow: "0 12px 30px rgba(34, 211, 238, 0.25)",
        transition: { duration: 0.2 } 
      }}
    >
      <motion.div 
        className="card-title text-sm sm:text-base md:text-lg lg:text-xl leading-tight"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {title}
      </motion.div>
      
      <motion.div
        className="gap-2 sm:gap-3 mb-3 sm:mb-4 flex-shrink-0"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(labels.length, 3)}, minmax(0, 1fr))`
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {labels.slice(0, 3).map((label, idx) => {
          // Para meta_ads e google_ads, os índices 0, 3, 4 são dinheiro
          const isMoney = (
            (system === 'meta_ads' || system === 'google_ads') &&
            (idx === 0 || idx === 3 || idx === 4)
          )
          return (
            <Metric key={label} label={label} value={k[idx]} isMoney={isMoney} />
          )
        })}
      </motion.div>

      {/* Segunda linha de métricas se houver mais de 3 */}
      {labels.length > 3 && (
        <motion.div
          className="gap-2 sm:gap-3 mb-3 sm:mb-4 flex-shrink-0"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(labels.length - 3, 3)}, minmax(0, 1fr))`
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {labels.slice(3, 6).map((label, idx) => {
            const realIdx = idx + 3;
            const isMoney = (
              (system === 'meta_ads' || system === 'google_ads') &&
              (realIdx === 0 || realIdx === 3 || realIdx === 4)
            )
            return (
              <Metric key={label} label={label} value={k[realIdx]} isMoney={isMoney} />
            )
          })}
        </motion.div>
      )}

      <motion.div 
        className="h-24 sm:h-28 lg:h-32 mt-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points}>
            <XAxis
              dataKey="x"
              tickFormatter={(value) => String(new Date(value).getUTCDate())}
              fontSize={10}
            />
            <Bar
              dataKey="y"
              fill="#22D3EE" // Neon bar color
              radius={4}
              label={{ position: 'center', fill: '#0F172A', fontSize: 10 }} // Label color for contrast
            />
            <Tooltip
              labelFormatter={(value) => String(new Date(value).getUTCDate())}
              formatter={(value: number) => [fmtNum(value), '']}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  )
}
