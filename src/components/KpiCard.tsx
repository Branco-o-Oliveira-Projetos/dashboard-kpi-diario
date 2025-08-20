import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { fetchKpis, fetchSeries } from '../lib/api'
import { fmtNum } from '../lib/format'
import type { SystemKey } from '../types'

interface KpiCardProps {
  system: SystemKey
  title: string
  labels: [string, string, string]
  autoRefreshMs: number | false
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-text">{fmtNum(value)}</div>
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

  const k = kpisQ.data?.values || [null, null, null]
  const points = seriesQ.data?.points || []

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 80, y: 0 }}
      transition={{ duration: 1.5 }}
    >
      <div className="card-title">{title}</div>
      <div className="grid grid-cols-3 gap-3">
        <Metric label={labels[0]} value={k[0]} />
        <Metric label={labels[1]} value={k[1]} />
        <Metric label={labels[2]} value={k[2]} />
      </div>

      <div className="h-28 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points}>
            <XAxis dataKey="x" tickFormatter={(value) => String(new Date(value).getDate())} />
            <Bar dataKey="y" fill="#06004B" radius={6} label={{ position: 'center', fill: '#E8E8E8' }} />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
              formatter={(value: number) => [fmtNum(value), '']}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
