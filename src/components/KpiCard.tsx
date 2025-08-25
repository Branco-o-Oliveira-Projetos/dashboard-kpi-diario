import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { fetchKpis, fetchSeries } from '../lib/api'
import { fmtNum, fmtMoney } from '../lib/format'
import type { SystemKey } from '../types'

interface KpiCardProps {
  system: SystemKey
  title: string
  labels: string[]
  autoRefreshMs: number | false
}

function Metric({ label, value, isMoney }: { label: string; value: number | null; isMoney?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-text">
        {isMoney ? fmtMoney(value) : fmtNum(value)}
      </div>
      <div className="text-xs text-text2 mt-1">{label}</div>
    </div>
  )
}

export default function KpiCard({
  system,
  title,
  labels,
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
      className="card"
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 80, y: 0 }}
      transition={{ duration: 1.5 }}
    >
      <div className="card-title">{title}</div>
      <div
        className="gap-3"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))`
        }}
      >
        {labels.map((label, idx) => {
          // Para meta_ads e google_ads, os índices 0, 3, 4 são dinheiro
          const isMoney = (
            (system === 'meta_ads' || system === 'google_ads') &&
            (idx === 0 || idx === 3 || idx === 4)
          )
          return (
            <Metric key={label} label={label} value={k[idx]} isMoney={isMoney} />
          )
        })}
      </div>

      <div className="h-28 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points}>
            <XAxis
              dataKey="x"
              tickFormatter={(value) => String(new Date(value).getUTCDate())}
            />
            <Bar
              dataKey="y"
              fill="#06004B"
              radius={6}
              label={{ position: 'center', fill: '#8a98ff' }}
            />
            <Tooltip
              labelFormatter={(value) => String(new Date(value).getUTCDate())}
              formatter={(value: number) => [fmtNum(value), '']}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
