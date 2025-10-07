
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
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
import { fetchPiperunAllPipelines } from '../lib/api'
import { fmtNum } from '../lib/format'

interface PiperunRecord {
  ref_date: string
  pipeline_id: string
  pipeline_name: string
  oportunidades_recebidas: number
  oportunidades_perdidas: number
  oportunidades_ganhas: number
  updated_at: string
}

interface AggregatedDay {
  date: string
  recebidas: number
  ganhas: number
  perdidas: number
}

interface PipelineGroup {
  id: string
  name: string
  records: PiperunRecord[]
}

interface PipelineSnapshot {
  id: string
  name: string
  recebidasDia: number
  ganhasDia: number
  perdidasDia: number
  winRateDia: number
  recebidas7: number
  ganhas7: number
  perdidas7: number
  winRate7: number
}

const safeDivide = (numerator: number, denominator: number) => {
  if (!denominator) return 0
  return numerator / denominator
}

const percentLabel = (value: number) => `${(value).toFixed(1)}%`

export default function PiperunDetail() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['piperun-all-pipelines'],
    queryFn: () => fetchPiperunAllPipelines(),
    refetchInterval: 2 * 60 * 1000
  })

  const records = useMemo<PiperunRecord[]>(() => {
    if (!Array.isArray(data)) return []
    return (data as PiperunRecord[]).filter(item => !!item.ref_date)
  }, [data])

  const pipelineGroups = useMemo<PipelineGroup[]>(() => {
    const map = new Map<string, PipelineGroup>()
    records.forEach(record => {
      const existing = map.get(record.pipeline_id)
      if (existing) {
        existing.records.push(record)
      } else {
        map.set(record.pipeline_id, {
          id: record.pipeline_id,
          name: record.pipeline_name,
          records: [record]
        })
      }
    })

    return Array.from(map.values()).map(group => ({
      ...group,
      records: [...group.records].sort((a, b) => new Date(b.ref_date + 'T00:00:00').getTime() - new Date(a.ref_date + 'T00:00:00').getTime())
    }))
  }, [records])

  const orderedDates = useMemo(() => {
    return Array.from(new Set(records.map(record => record.ref_date)))
      .sort((a, b) => new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime())
  }, [records])

  const mostRecentDate = orderedDates[0] ?? ''
  const previousDate = orderedDates[1] ?? ''

  const todayRecords = useMemo(() => records.filter(record => record.ref_date === mostRecentDate), [records, mostRecentDate])
  const previousRecords = useMemo(() => records.filter(record => record.ref_date === previousDate), [records, previousDate])

  const aggregateDay = (source: PiperunRecord[]) => {
    return source.reduce(
      (acc, record) => {
        acc.recebidas += record.oportunidades_recebidas || 0
        acc.ganhas += record.oportunidades_ganhas || 0
        acc.perdidas += record.oportunidades_perdidas || 0
        return acc
      },
      { recebidas: 0, ganhas: 0, perdidas: 0 }
    )
  }

  const todayTotals = useMemo(() => aggregateDay(todayRecords), [todayRecords])
  const previousTotals = useMemo(() => aggregateDay(previousRecords), [previousRecords])

  const backlogHoje = todayTotals.recebidas - todayTotals.ganhas - todayTotals.perdidas
  const backlogOntem = previousTotals.recebidas - previousTotals.ganhas - previousTotals.perdidas

  const winRateHoje = safeDivide(todayTotals.ganhas, todayTotals.recebidas) * 100
  const winRateOntem = safeDivide(previousTotals.ganhas, previousTotals.recebidas) * 100

  const percentChange = (current: number, previous: number) => {
    if (previous === 0) {
      if (current === 0) return 0
      return 100
    }
    return ((current - previous) / previous) * 100
  }

  const lastUpdatedLabel = useMemo(() => {
    const latestTimestamp = records.reduce((latest, record) => {
      const current = record.updated_at ? new Date(record.updated_at).getTime() : 0
      return current > latest ? current : latest
    }, 0)
    return latestTimestamp ? new Date(latestTimestamp).toLocaleString('pt-BR') : '-'
  }, [records])

  const dailyTrend = useMemo<AggregatedDay[]>(() => {
    const map = new Map<string, AggregatedDay>()
    records.forEach(record => {
      const existing = map.get(record.ref_date)
      const recebidas = record.oportunidades_recebidas || 0
      const ganhas = record.oportunidades_ganhas || 0
      const perdidas = record.oportunidades_perdidas || 0

      if (existing) {
        existing.recebidas += recebidas
        existing.ganhas += ganhas
        existing.perdidas += perdidas
      } else {
        map.set(record.ref_date, {
          date: record.ref_date,
          recebidas,
          ganhas,
          perdidas
        })
      }
    })

    return Array.from(map.values())
      .sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime())
      .slice(-30)
  }, [records])

  const pipelineSnapshots = useMemo<PipelineSnapshot[]>(() => {
    return pipelineGroups.map(group => {
      const today = group.records.find(record => record.ref_date === mostRecentDate) || group.records[0]
      const last7 = group.records.slice(0, 7)

      const sum7 = last7.reduce(
        (acc, record) => {
          acc.recebidas += record.oportunidades_recebidas || 0
          acc.ganhas += record.oportunidades_ganhas || 0
          acc.perdidas += record.oportunidades_perdidas || 0
          return acc
        },
        { recebidas: 0, ganhas: 0, perdidas: 0 }
      )

      const recebidasDia = today?.oportunidades_recebidas || 0
      const ganhasDia = today?.oportunidades_ganhas || 0
      const perdidasDia = today?.oportunidades_perdidas || 0

      return {
        id: group.id,
        name: group.name,
        recebidasDia,
        ganhasDia,
        perdidasDia,
        winRateDia: safeDivide(ganhasDia, recebidasDia) * 100,
        recebidas7: sum7.recebidas,
        ganhas7: sum7.ganhas,
        perdidas7: sum7.perdidas,
        winRate7: safeDivide(sum7.ganhas, sum7.recebidas) * 100
      }
    }).sort((a, b) => b.ganhasDia - a.ganhasDia)
  }, [pipelineGroups, mostRecentDate])

  const pipelineComparisonSeries = useMemo(() => {
    const dateMap = new Map<string, Record<string, number | string>>()

    pipelineGroups.forEach(group => {
      group.records.forEach(record => {
        const entry = dateMap.get(record.ref_date) || { date: record.ref_date }
        entry[`ganhas_${group.id}`] = ((entry[`ganhas_${group.id}`] as number) || 0) + (record.oportunidades_ganhas || 0)
        dateMap.set(record.ref_date, entry)
      })
    })

    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date as string + 'T00:00:00').getTime() - new Date(b.date as string + 'T00:00:00').getTime())
      .slice(-30)
  }, [pipelineGroups])

  const pipelineLineKeys = pipelineGroups.map(group => ({ id: group.id, name: group.name }))

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
        Erro ao carregar dados do PipeRun.
      </div>
    )
  }

  if (!records.length) {
    return (
      <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text">
        <motion.div className="card text-center py-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          Nenhum dado disponível para PipeRun no momento.
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text">
      <motion.div className="mb-6" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <motion.h1 className="text-2xl sm:text-3xl font-bold text-text mb-2 flex flex-wrap items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          PipeRun – Visão de Oportunidades
        </motion.h1>
        <motion.div className="flex flex-wrap items-center gap-4 text-text2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <span>Referência: {mostRecentDate ? new Date(mostRecentDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</span>
          <span className="text-xs bg-bg2/60 text-text px-2 py-1 rounded-md">Última sincronização: {lastUpdatedLabel}</span>
        </motion.div>
        <motion.div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}>
          <span className="text-sm text-text2">Pipelines monitoradas: {pipelineGroups.length}</span>
          <Link to="/" className="text-blue-400 hover:underline inline-flex items-center gap-2 group">
            <motion.span whileHover={{ x: -4 }} transition={{ type: 'spring', stiffness: 320 }}>
              Voltar ao dashboard
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Oportunidades recebidas</p>
          <p className="text-lg sm:text-xl font-semibold">{fmtNum(todayTotals.recebidas)}</p>
          <p className="text-xs text-text2">Variação vs dia anterior: {percentLabel(percentChange(todayTotals.recebidas, previousTotals.recebidas))}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Oportunidades ganhas</p>
          <p className="text-lg sm:text-xl font-semibold text-emerald-300">{fmtNum(todayTotals.ganhas)}</p>
          <p className="text-xs text-text2">Variação vs dia anterior: {percentLabel(percentChange(todayTotals.ganhas, previousTotals.ganhas))}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Oportunidades perdidas</p>
          <p className="text-lg sm:text-xl font-semibold text-neonPink">{fmtNum(todayTotals.perdidas)}</p>
          <p className="text-xs text-text2">Variação vs dia anterior: {percentLabel(percentChange(todayTotals.perdidas, previousTotals.perdidas))}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Taxa de ganho</p>
          <p className={`text-lg sm:text-xl font-semibold ${winRateHoje >= 30 ? 'text-emerald-300' : 'text-text'}`}>{percentLabel(winRateHoje)}</p>
          <p className="text-xs text-text2">Variação vs dia anterior: {percentLabel(percentChange(winRateHoje, winRateOntem))}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Backlog do dia</p>
          <p className="text-lg sm:text-xl font-semibold">{fmtNum(backlogHoje)}</p>
          <p className="text-xs text-text2">Variação vs dia anterior: {percentLabel(percentChange(backlogHoje, backlogOntem))}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Pipelines com ganho</p>
          <p className="text-lg sm:text-xl font-semibold">{pipelineSnapshots.filter(item => item.ganhasDia > 0).length}</p>
          <p className="text-xs text-text2">de {pipelineSnapshots.length} monitoradas</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Recebidas nos últimos 7 dias</p>
          <p className="text-lg sm:text-xl font-semibold">{fmtNum(pipelineSnapshots.reduce((acc, item) => acc + item.recebidas7, 0))}</p>
          <p className="text-xs text-text2">Ganhos em 7 dias: {fmtNum(pipelineSnapshots.reduce((acc, item) => acc + item.ganhas7, 0))}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Taxa de ganho 7 dias</p>
          <p className="text-lg sm:text-xl font-semibold text-blue-300">{percentLabel(safeDivide(pipelineSnapshots.reduce((acc, item) => acc + item.ganhas7, 0), pipelineSnapshots.reduce((acc, item) => acc + item.recebidas7, 0)) * 100)}</p>
          <p className="text-xs text-text2">Indicador de tendência semanal</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} whileHover={{ y: -2 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-sm sm:text-lg">Fluxo diário de oportunidades</h3>
            <span className="text-xs text-text2">Últimos 30 dias</span>
          </div>
          <div className="h-72">
            {dailyTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tickFormatter={value => new Date(value + 'T00:00:00').getDate().toString()} fontSize={10} />
                  <YAxis yAxisId="left" fontSize={10} tickFormatter={value => fmtNum(value as number)} width={80} />
                  <Tooltip
                    labelFormatter={value => new Date(value + 'T00:00:00').toLocaleDateString('pt-BR')}
                    formatter={(value, name) => [fmtNum(value as number), name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                  <Legend formatter={value => value.charAt(0).toUpperCase() + value.slice(1)} />
                  <Bar yAxisId="left" dataKey="recebidas" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Recebidas" />
                  <Line yAxisId="left" type="monotone" dataKey="ganhas" stroke="#22c55e" strokeWidth={3} dot={{ r: 2 }} name="Ganhas" />
                  <Line yAxisId="left" type="monotone" dataKey="perdidas" stroke="#f97316" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 2 }} name="Perdidas" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text2 text-sm">
                Sem histórico disponível para o período.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} whileHover={{ y: -2 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-sm sm:text-lg">Ganho por pipeline ao longo do tempo</h3>
            <span className="text-xs text-text2">Últimos 30 dias</span>
          </div>
          <div className="h-72">
            {pipelineComparisonSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={pipelineComparisonSeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tickFormatter={value => new Date(value + 'T00:00:00').getDate().toString()} fontSize={10} />
                  <YAxis fontSize={10} tickFormatter={value => fmtNum(value as number)} width={80} />
                  <Tooltip
                    labelFormatter={value => new Date(value + 'T00:00:00').toLocaleDateString('pt-BR')}
                    formatter={(value, name) => [fmtNum(value as number), name]}
                  />
                  <Legend />
                  {pipelineLineKeys.map((pipeline, index) => (
                    <Line
                      key={pipeline.id}
                      type="monotone"
                      dataKey={`ganhas_${pipeline.id}`}
                      stroke={[ '#22c55e', '#38bdf8', '#f97316', '#a855f7', '#ec4899' ][index % 5]}
                      strokeWidth={3}
                      dot={{ r: 2 }}
                      name={`${pipeline.name} - ganhas`}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text2 text-sm">
                Sem histórico suficiente para análise por pipeline.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} whileHover={{ y: -2 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="card-title">Painel por pipeline</h3>
          <span className="text-xs text-text2">Resumo diário e dos últimos 7 dias</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-bg2">
                <th className="text-left p-2">Pipeline</th>
                <th className="text-right p-2">Recebidas (dia)</th>
                <th className="text-right p-2">Ganhas (dia)</th>
                <th className="text-right p-2">Perdidas (dia)</th>
                <th className="text-right p-2">Win rate dia</th>
                <th className="text-right p-2">Recebidas (7d)</th>
                <th className="text-right p-2">Ganhas (7d)</th>
                <th className="text-right p-2">Perdidas (7d)</th>
                <th className="text-right p-2">Win rate 7d</th>
              </tr>
            </thead>
            <tbody>
              {pipelineSnapshots.length ? (
                pipelineSnapshots.map((pipeline, index) => (
                  <motion.tr
                    key={pipeline.id}
                    className="border-b border-bg2/40 hover:bg-bg2/20"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03 }}
                  >
                    <td className="p-2 truncate max-w-[220px]" title={pipeline.name}>{pipeline.name}</td>
                    <td className="p-2 text-right">{fmtNum(pipeline.recebidasDia)}</td>
                    <td className="p-2 text-right text-emerald-300">{fmtNum(pipeline.ganhasDia)}</td>
                    <td className="p-2 text-right text-neonPink">{fmtNum(pipeline.perdidasDia)}</td>
                    <td className="p-2 text-right">{percentLabel(pipeline.winRateDia)}</td>
                    <td className="p-2 text-right">{fmtNum(pipeline.recebidas7)}</td>
                    <td className="p-2 text-right text-emerald-300">{fmtNum(pipeline.ganhas7)}</td>
                    <td className="p-2 text-right text-neonPink">{fmtNum(pipeline.perdidas7)}</td>
                    <td className="p-2 text-right">{percentLabel(pipeline.winRate7)}</td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center text-text2 p-4">
                    Não encontramos pipelines para o período selecionado.
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
