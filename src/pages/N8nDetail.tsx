
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { fetchDetailedData } from '../lib/api'
import { fmtNum } from '../lib/format'

interface N8nRecord {
  ref_date: string
  workspace_id: string
  workspace_name: string
  flows_total: number
  runs_success: number
  runs_failed: number
  avg_duration_sec: number
  updated_at: string
}

interface DailySummary {
  date: string
  flows: number
  success: number
  failed: number
  totalRuns: number
  successRate: number
  avgDuration: number
}

interface WorkspaceSnapshot {
  id: string
  name: string
  flows: number
  success: number
  failed: number
  successRate: number
  avgDuration: number
}

const safeDivide = (numerator: number, denominator: number) => {
  if (!denominator) return 0
  return numerator / denominator
}

const secondsToLabel = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '-'
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}m ${remaining.toFixed(0)}s`
}

const percentLabel = (value: number) => `${value.toFixed(1)}%`

export default function N8nDetail() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['n8n-detail'],
    queryFn: () => fetchDetailedData('n8n'),
    refetchInterval: 2 * 60 * 1000
  })

  const records = useMemo<N8nRecord[]>(() => {
    if (!Array.isArray(data)) return []
    return (data as N8nRecord[]).filter(item => !!item.ref_date)
  }, [data])

  const orderedDates = useMemo(() => {
    return Array.from(new Set(records.map(record => record.ref_date)))
      .sort((a, b) => new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime())
  }, [records])

  const mostRecentDate = orderedDates[0] ?? ''
  const previousDate = orderedDates[1] ?? ''

  const todayRecords = useMemo(() => records.filter(record => record.ref_date === mostRecentDate), [records, mostRecentDate])
  const previousRecords = useMemo(() => records.filter(record => record.ref_date === previousDate), [records, previousDate])

  const aggregate = (source: N8nRecord[]) => {
    return source.reduce(
      (acc, record) => {
        const success = record.runs_success || 0
        const failed = record.runs_failed || 0
        const total = success + failed
        acc.flows += record.flows_total || 0
        acc.success += success
        acc.failed += failed
        acc.totalRuns += total
        acc.durationSum += record.avg_duration_sec * total
        acc.items += 1
        return acc
      },
      { flows: 0, success: 0, failed: 0, totalRuns: 0, durationSum: 0, items: 0 }
    )
  }

  const todayTotals = useMemo(() => aggregate(todayRecords), [todayRecords])
  const previousTotals = useMemo(() => aggregate(previousRecords), [previousRecords])

  const conversionRate = safeDivide(todayTotals.success, todayTotals.totalRuns) * 100
  const conversionRatePrev = safeDivide(previousTotals.success, previousTotals.totalRuns) * 100
  const successDelta = conversionRate - conversionRatePrev

  const failureRate = safeDivide(todayTotals.failed, todayTotals.totalRuns) * 100
  const avgDuration = todayTotals.totalRuns ? todayTotals.durationSum / todayTotals.totalRuns : 0

  const lastUpdatedLabel = useMemo(() => {
    const latestTimestamp = records.reduce((latest, record) => {
      const current = record.updated_at ? new Date(record.updated_at).getTime() : 0
      return current > latest ? current : latest
    }, 0)
    return latestTimestamp ? new Date(latestTimestamp).toLocaleString('pt-BR') : '-'
  }, [records])

  const dailySeries = useMemo<DailySummary[]>(() => {
    const map = new Map<string, DailySummary>()
    records.forEach(record => {
      const existing = map.get(record.ref_date)
      const success = record.runs_success || 0
      const failed = record.runs_failed || 0
      const total = success + failed
      const avgDuration = total ? record.avg_duration_sec : 0

      if (existing) {
        existing.flows += record.flows_total || 0
        existing.success += success
        existing.failed += failed
        existing.totalRuns += total
        if (avgDuration) {
          existing.avgDuration = (existing.avgDuration + avgDuration) / 2
        }
      } else {
        map.set(record.ref_date, {
          date: record.ref_date,
          flows: record.flows_total || 0,
          success,
          failed,
          totalRuns: total,
          successRate: total ? (success / total) * 100 : 0,
          avgDuration: avgDuration
        })
      }
    })

    return Array.from(map.values())
      .sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime())
      .slice(-30)
  }, [records])

  const workspaceSnapshots = useMemo<WorkspaceSnapshot[]>(() => {
    return todayRecords.map(record => {
      const success = record.runs_success || 0
      const failed = record.runs_failed || 0
      const total = success + failed
      return {
        id: record.workspace_id,
        name: record.workspace_name || 'Workspace não identificado',
        flows: record.flows_total || 0,
        success,
        failed,
        successRate: total ? (success / total) * 100 : 0,
        avgDuration: record.avg_duration_sec || 0
      }
    }).sort((a, b) => b.success - a.success)
  }, [todayRecords])

  const deltaLabel = (value: number) => {
    if (!Number.isFinite(value) || value === 0) return 'sem variação'
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}pp vs dia anterior`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text">
        <div className="mb-6 space-y-3">
          <motion.div className="h-8 bg-bg2 rounded-lg" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.4, repeat: Infinity }} />
          <motion.div className="h-4 bg-bg2 rounded-lg w-1/3" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, index) => (
            <motion.div key={index} className="card h-24 bg-bg2/60" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.08 }} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(3)].map((_, index) => (
            <motion.div key={index} className="card h-72 bg-bg2/60" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 + (index * 0.1) }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text text-center pt-24 text-neonPink">
        Erro ao carregar dados do n8n.
      </div>
    )
  }

  if (!records.length) {
    return (
      <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text">
        <motion.div className="card text-center py-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          Nenhum dado disponível para n8n no momento.
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text">
      <motion.div className="mb-6" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <motion.h1 className="text-2xl sm:text-3xl font-bold text-text mb-2 flex flex-wrap items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          n8n – Confiabilidade operacional
        </motion.h1>
        <motion.div className="flex flex-wrap items-center gap-4 text-text2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <span>Referência: {mostRecentDate ? new Date(mostRecentDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</span>
          <span className="text-xs bg-bg2/60 text-text px-2 py-1 rounded-md">Última sincronização: {lastUpdatedLabel}</span>
        </motion.div>
        <motion.div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}>
          <span className="text-sm text-text2">Workspaces monitorados: {new Set(records.map(record => record.workspace_id)).size}</span>
          <Link to="/" className="text-blue-400 hover:underline inline-flex items-center gap-2 group">
            <motion.span whileHover={{ x: -4 }} transition={{ type: 'spring', stiffness: 320 }}>
              Voltar ao dashboard
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Execuções monitoradas</p>
          <p className="text-lg sm:text-xl font-semibold">{fmtNum(todayTotals.totalRuns)}</p>
          <p className="text-xs text-text2">Fluxos ativos: {fmtNum(todayTotals.flows)}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Taxa de sucesso</p>
          <p className="text-lg sm:text-xl font-semibold text-emerald-300">{percentLabel(conversionRate)}</p>
          <p className="text-xs text-text2">{deltaLabel(successDelta)}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Falhas registradas</p>
          <p className="text-lg sm:text-xl font-semibold text-neonPink">{fmtNum(todayTotals.failed)}</p>
          <p className="text-xs text-text2">Representam {percentLabel(failureRate)} das execuções</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Duração média</p>
          <p className="text-lg sm:text-xl font-semibold">{secondsToLabel(avgDuration)}</p>
          <p className="text-xs text-text2">Tempo médio por execução bem-sucedida</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} whileHover={{ y: -2 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-sm sm:text-lg">Trilha de confiabilidade</h3>
            <span className="text-xs text-text2">Últimos 30 dias</span>
          </div>
          <div className="h-72">
            {dailySeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tickFormatter={value => new Date(value + 'T00:00:00').getDate().toString()} fontSize={10} />
                  <YAxis yAxisId="left" fontSize={10} tickFormatter={value => fmtNum(value as number)} width={90} />
                  <YAxis yAxisId="right" orientation="right" fontSize={10} tickFormatter={value => percentLabel(value as number).replace('%', '')} />
                                    <Tooltip
                    labelFormatter={value => new Date(value + 'T00:00:00').toLocaleDateString('pt-BR')}
                    formatter={(value, _name, item) => {
                      const key = (item?.dataKey as string) || ''
                      if (key === 'successRate') return [percentLabel(value as number), 'Taxa de sucesso']
                      if (key === 'success') return [fmtNum(value as number), 'Sucesso']
                      if (key === 'failed') return [fmtNum(value as number), 'Falhas']
                      if (key === 'totalRuns') return [fmtNum(value as number), 'Execuções']
                      return [fmtNum(value as number), key]
                    }}
                  />
                  <Legend formatter={value => {
                    if (value === 'success') return 'Sucesso'
                    if (value === 'failed') return 'Falhas'
                    if (value === 'totalRuns') return 'Execuções'
                    if (value === 'successRate') return 'Taxa de sucesso'
                    return value
                  }} />
                  <Area yAxisId="left" type="monotone" dataKey="totalRuns" stroke="#2563eb" fill="#2563eb" fillOpacity={0.12} strokeWidth={2} name="Execuções" />
                  <Bar yAxisId="left" dataKey="success" fill="#22c55e" radius={[4, 4, 0, 0]} name="Sucesso" />
                  <Line yAxisId="left" type="monotone" dataKey="failed" stroke="#f97316" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} name="Falhas" />
                  <Line yAxisId="right" type="monotone" dataKey="successRate" stroke="#38bdf8" strokeWidth={3} dot={{ r: 2 }} name="Taxa de sucesso" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text2 text-sm">
                Sem histórico suficiente para análise.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} whileHover={{ y: -2 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-sm sm:text-lg">Tempo médio por execução</h3>
            <span className="text-xs text-text2">Últimos 30 dias</span>
          </div>
          <div className="h-72">
            {dailySeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tickFormatter={value => new Date(value + 'T00:00:00').getDate().toString()} fontSize={10} />
                  <YAxis fontSize={10} tickFormatter={value => secondsToLabel(value as number)} width={90} />
                  <Tooltip
                    labelFormatter={value => new Date(value + 'T00:00:00').toLocaleDateString('pt-BR')}
                    formatter={(value: number) => [secondsToLabel(value), 'Duração média']}
                  />
                  <Legend formatter={() => 'Duração média'} />
                  <Bar dataKey="avgDuration" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text2 text-sm">
                Sem histórico de duração disponível.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} whileHover={{ y: -2 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="card-title">Workspaces sob monitoramento</h3>
          <span className="text-xs text-text2">Tabela diária com indicadores chave</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-bg2">
                <th className="text-left p-2">Workspace</th>
                <th className="text-right p-2">Execuções</th>
                <th className="text-right p-2">Sucesso</th>
                <th className="text-right p-2">Falha</th>
                <th className="text-right p-2">Taxa de sucesso</th>
                <th className="text-right p-2">Duração média</th>
              </tr>
            </thead>
            <tbody>
              {workspaceSnapshots.length ? (
                workspaceSnapshots.map((workspace, index) => (
                  <motion.tr
                    key={workspace.id}
                    className="border-b border-bg2/40 hover:bg-bg2/20"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03 }}
                  >
                    <td className="p-2 truncate max-w-[220px]" title={workspace.name}>{workspace.name}</td>
                    <td className="p-2 text-right">{fmtNum(workspace.success + workspace.failed)}</td>
                    <td className="p-2 text-right text-emerald-300">{fmtNum(workspace.success)}</td>
                    <td className="p-2 text-right text-neonPink">{fmtNum(workspace.failed)}</td>
                    <td className="p-2 text-right">{percentLabel(workspace.successRate)}</td>
                    <td className="p-2 text-right">{secondsToLabel(workspace.avgDuration)}</td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center text-text2 p-4">
                    Nenhum workspace com dados no dia selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
