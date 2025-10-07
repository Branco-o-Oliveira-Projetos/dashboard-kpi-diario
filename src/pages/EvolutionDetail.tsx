
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

interface EvolutionRecord {
  ref_date: string
  instance_name: string
  instance_id: string
  owner: string
  api_version: string
  update_at: string
  instance_status: string
  conn_state_current: string
  messages_sent_total: number
  client_messages: number
  response_messages: number
  delivered_message: number
  read_for_client: number
  delivered_rate_pct: number
  read_rate_pct: number
  chats_active: number
  total_chats: number
  frt_seconds: number
  frt_avg_minutes: number
  chats_no_response_over_threshold: number
  response_threshold_minutes: number
}

interface DailySummary {
  date: string
  totalMessages: number
  clientMessages: number
  responseMessages: number
  deliveredRate: number
  readRate: number
  responseTime: number
  chatsActive: number
}

interface InstanceSnapshot {
  id: string
  name: string
  owner: string
  status: string
  connState: string
  messages: number
  responseMessages: number
  deliveredRate: number
  readRate: number
  responseTime: number
  activeChats: number
}

const safeDivide = (numerator: number, denominator: number) => {
  if (!denominator) return 0
  return numerator / denominator
}

const percentLabel = (value: number) => `${value.toFixed(1)}%`

const secondsToLabel = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '-'
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}m ${remainder.toFixed(0)}s`
}

export default function EvolutionDetail() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['evolution-detail'],
    queryFn: () => fetchDetailedData('evolution'),
    refetchInterval: 2 * 60 * 1000
  })

  const records = useMemo<EvolutionRecord[]>(() => {
    if (!Array.isArray(data)) return []
    return (data as EvolutionRecord[]).filter(item => !!item.ref_date)
  }, [data])

  const orderedDates = useMemo(() => {
    return Array.from(new Set(records.map(record => record.ref_date)))
      .sort((a, b) => new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime())
  }, [records])

  const mostRecentDate = orderedDates[0] ?? ''
  const previousDate = orderedDates[1] ?? ''

  const todayRecords = useMemo(() => records.filter(record => record.ref_date === mostRecentDate), [records, mostRecentDate])
  const previousRecords = useMemo(() => records.filter(record => record.ref_date === previousDate), [records, previousDate])

  const aggregateDay = (source: EvolutionRecord[]) => {
    return source.reduce(
      (acc, record) => {
        const messages = record.messages_sent_total || 0
        const clientMessages = record.client_messages || 0
        const responseMessages = record.response_messages || 0
        const deliveredRate = record.delivered_rate_pct || 0
        const readRate = record.read_rate_pct || 0
        const responseTime = record.frt_seconds || 0
        const activeChats = record.chats_active || 0

        acc.totalMessages += messages
        acc.clientMessages += clientMessages
        acc.responseMessages += responseMessages
        acc.deliveredRate += deliveredRate
        acc.readRate += readRate
        acc.responseTime += responseTime
        acc.activeChats += activeChats
        acc.items += 1
        return acc
      },
      {
        totalMessages: 0,
        clientMessages: 0,
        responseMessages: 0,
        deliveredRate: 0,
        readRate: 0,
        responseTime: 0,
        activeChats: 0,
        items: 0
      }
    )
  }

  const todayTotals = useMemo(() => aggregateDay(todayRecords), [todayRecords])
  const previousTotals = useMemo(() => aggregateDay(previousRecords), [previousRecords])

  const deliveredRateToday = todayTotals.items ? todayTotals.deliveredRate / todayTotals.items : 0
  const deliveredRatePrev = previousTotals.items ? previousTotals.deliveredRate / previousTotals.items : 0
  const readRateToday = todayTotals.items ? todayTotals.readRate / todayTotals.items : 0

  const delta = (current: number, previous: number) => {
    if (!Number.isFinite(current) || !Number.isFinite(previous)) return 0
    if (previous === 0) {
      if (current === 0) return 0
      return 100
    }
    return ((current - previous) / previous) * 100
  }

  const lastUpdatedLabel = useMemo(() => {
    const latestTimestamp = records.reduce((latest, record) => {
      const current = record.update_at ? new Date(record.update_at).getTime() : 0
      return current > latest ? current : latest
    }, 0)
    return latestTimestamp ? new Date(latestTimestamp).toLocaleString('pt-BR') : '-'
  }, [records])

  const dailySeries = useMemo<DailySummary[]>(() => {
    const map = new Map<string, DailySummary>()
    records.forEach(record => {
      const existing = map.get(record.ref_date)
      const messages = record.messages_sent_total || 0
      const clientMessages = record.client_messages || 0
      const responseMessages = record.response_messages || 0
      const delivered = record.delivered_rate_pct || 0
      const read = record.read_rate_pct || 0
      const responseTime = record.frt_seconds || 0
      const chatsActive = record.chats_active || 0

      if (existing) {
        existing.totalMessages += messages
        existing.clientMessages += clientMessages
        existing.responseMessages += responseMessages
        existing.deliveredRate += delivered
        existing.readRate += read
        existing.responseTime += responseTime
        existing.chatsActive += chatsActive
        existing.count += 1
      } else {
        map.set(record.ref_date, {
          date: record.ref_date,
          totalMessages: messages,
          clientMessages,
          responseMessages,
          deliveredRate: delivered,
          readRate: read,
          responseTime,
          chatsActive,
          count: 1
        } as DailySummary & { count: number })
      }
    })

    return Array.from(map.values()).map(item => ({
      date: item.date,
      totalMessages: item.totalMessages,
      clientMessages: item.clientMessages,
      responseMessages: item.responseMessages,
      deliveredRate: item.count ? item.deliveredRate / item.count : 0,
      readRate: item.count ? item.readRate / item.count : 0,
      responseTime: item.count ? item.responseTime / item.count : 0,
      chatsActive: item.chatsActive
    })).sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime()).slice(-30)
  }, [records])

  const instanceSnapshots = useMemo<InstanceSnapshot[]>(() => {
    return todayRecords.map(record => {
      const delivered = record.delivered_rate_pct || 0
      const read = record.read_rate_pct || 0
      const messages = record.messages_sent_total || 0
      const responses = record.response_messages || 0
      const responseTime = record.frt_seconds || 0
      const activeChats = record.chats_active || 0

      return {
        id: record.instance_id,
        name: record.instance_name || 'Instância não identificada',
        owner: record.owner || '—',
        status: record.instance_status || 'Desconhecido',
        connState: record.conn_state_current || 'Desconhecido',
        messages,
        responseMessages: responses,
        deliveredRate: delivered,
        readRate: read,
        responseTime,
        activeChats
      }
    }).sort((a, b) => b.messages - a.messages)
  }, [todayRecords])

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
        Erro ao carregar dados do Evolution.
      </div>
    )
  }

  if (!records.length) {
    return (
      <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text">
        <motion.div className="card text-center py-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          Nenhum dado disponível para Evolution no momento.
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text">
      <motion.div className="mb-6" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <motion.h1 className="text-2xl sm:text-3xl font-bold text-text mb-2 flex flex-wrap items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          Evolution – Saúde das Instâncias WhatsApp
        </motion.h1>
        <motion.div className="flex flex-wrap items-center gap-4 text-text2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <span>Referência: {mostRecentDate ? new Date(mostRecentDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</span>
          <span className="text-xs bg-bg2/60 text-text px-2 py-1 rounded-md">Última sincronização: {lastUpdatedLabel}</span>
        </motion.div>
        <motion.div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}>
          <span className="text-sm text-text2">Instâncias ativas monitoradas: {new Set(records.map(record => record.instance_id)).size}</span>
          <Link to="/" className="text-blue-400 hover:underline inline-flex items-center gap-2 group">
            <motion.span whileHover={{ x: -4 }} transition={{ type: 'spring', stiffness: 320 }}>
              Voltar ao dashboard
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Mensagens enviadas</p>
          <p className="text-lg sm:text-xl font-semibold">{fmtNum(todayTotals.totalMessages)}</p>
          <p className="text-xs text-text2">Variação vs dia anterior: {percentLabel(delta(todayTotals.totalMessages, previousTotals.totalMessages))}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Taxa de entrega</p>
          <p className="text-lg sm:text-xl font-semibold text-emerald-300">{percentLabel(deliveredRateToday)}</p>
          <p className="text-xs text-text2">Delta vs dia anterior: {percentLabel(deliveredRateToday - deliveredRatePrev)}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Tempo de resposta (FRT)</p>
          <p className="text-lg sm:text-xl font-semibold">{secondsToLabel(todayTotals.items ? todayTotals.responseTime / todayTotals.items : 0)}</p>
          <p className="text-xs text-text2">Ocorrências acima do limite: {fmtNum(todayRecords.reduce((acc, item) => acc + (item.chats_no_response_over_threshold || 0), 0))}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Chats ativos</p>
          <p className="text-lg sm:text-xl font-semibold">{fmtNum(todayTotals.activeChats)}</p>
          <p className="text-xs text-text2">Cliente {'>'} Atendimento: {fmtNum(todayTotals.clientMessages)} | Atendimento {'>'} Cliente: {fmtNum(todayTotals.responseMessages)}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} whileHover={{ y: -2 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-sm sm:text-lg">Ritmo de mensagens</h3>
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
                      switch (key) {
                        case 'clientMessages':
                          return [fmtNum(value as number), 'Cliente > Atendimento']
                        case 'responseMessages':
                          return [fmtNum(value as number), 'Atendimento > Cliente']
                        case 'deliveredRate':
                          return [percentLabel(value as number), 'Taxa de entrega']
                        case 'readRate':
                          return [percentLabel(value as number), 'Taxa de leitura']
                        case 'totalMessages':
                          return [fmtNum(value as number), 'Total de mensagens']
                        default:
                          return [fmtNum(value as number), key]
                      }
                    }}
                  />
                  <Legend
                    formatter={(value, entry) => {
                      const key = (entry?.dataKey as string) || value
                      switch (key) {
                        case 'clientMessages':
                          return 'Cliente > Atendimento'
                        case 'responseMessages':
                          return 'Atendimento > Cliente'
                        case 'deliveredRate':
                          return 'Taxa de entrega'
                        case 'readRate':
                          return 'Taxa de leitura'
                        case 'totalMessages':
                          return 'Total de mensagens'
                        default:
                          return value
                      }
                    }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="totalMessages" stroke="#2563eb" fill="#2563eb" fillOpacity={0.12} strokeWidth={2} name="Total de mensagens" />
                  <Bar yAxisId="left" dataKey="clientMessages" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Cliente > Atendimento" />
                  <Bar yAxisId="left" dataKey="responseMessages" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.6} name="Atendimento > Cliente" />
                  <Line yAxisId="right" type="monotone" dataKey="deliveredRate" stroke="#facc15" strokeWidth={3} dot={{ r: 2 }} name="Taxa de entrega" />
                  <Line yAxisId="right" type="monotone" dataKey="readRate" stroke="#f97316" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} name="Taxa de leitura" />
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
            <h3 className="card-title text-sm sm:text-lg">Tempo de resposta e chats ativos</h3>
            <span className="text-xs text-text2">Últimos 30 dias</span>
          </div>
          <div className="h-72">
            {dailySeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tickFormatter={value => new Date(value + 'T00:00:00').getDate().toString()} fontSize={10} />
                  <YAxis yAxisId="left" fontSize={10} tickFormatter={value => secondsToLabel(value as number)} width={90} />
                  <YAxis yAxisId="right" orientation="right" fontSize={10} tickFormatter={value => fmtNum(value as number)} />
                  <Tooltip
                    labelFormatter={value => new Date(value + 'T00:00:00').toLocaleDateString('pt-BR')}
                    formatter={(value, _name, item) => {
                      const key = (item?.dataKey as string) || ''
                      if (key === 'responseTime') return [secondsToLabel(value as number), 'Tempo de resposta']
                      if (key === 'chatsActive') return [fmtNum(value as number), 'Chats ativos']
                      return [fmtNum(value as number), key]
                    }}
                  />
                  <Legend
                    formatter={(value, entry) => {
                      const key = (entry?.dataKey as string) || value
                      if (key === 'responseTime') return 'Tempo de resposta'
                      if (key === 'chatsActive') return 'Chats ativos'
                      return value
                    }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="responseTime" stroke="#a855f7" fill="#a855f7" fillOpacity={0.12} strokeWidth={2} name="Tempo de resposta" />
                  <Bar yAxisId="right" dataKey="chatsActive" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Chats ativos" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text2 text-sm">
                Sem dados suficientes para o período.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} whileHover={{ y: -2 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="card-title">Instâncias monitoradas</h3>
          <span className="text-xs text-text2">Resumo diário por instância</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-bg2">
                <th className="text-left p-2">Instância</th>
                <th className="text-left p-2">Responsável</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Conexão</th>
                <th className="text-right p-2">Mensagens</th>
                <th className="text-right p-2">Respostas</th>
                <th className="text-right p-2">Taxa de entrega</th>
                <th className="text-right p-2">Taxa de leitura</th>
                <th className="text-right p-2">Tempo resposta</th>
                <th className="text-right p-2">Chats ativos</th>
              </tr>
            </thead>
            <tbody>
              {instanceSnapshots.length ? (
                instanceSnapshots.map((instance, index) => (
                  <motion.tr
                    key={instance.id}
                    className="border-b border-bg2/40 hover:bg-bg2/20"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03 }}
                  >
                    <td className="p-2 truncate max-w-[200px]" title={instance.name}>{instance.name}</td>
                    <td className="p-2 truncate max-w-[160px]" title={instance.owner}>{instance.owner}</td>
                    <td className="p-2">{instance.status || '—'}</td>
                    <td className="p-2">{instance.connState || '—'}</td>
                    <td className="p-2 text-right">{fmtNum(instance.messages)}</td>
                    <td className="p-2 text-right text-emerald-300">{fmtNum(instance.responseMessages)}</td>
                    <td className="p-2 text-right">{percentLabel(instance.deliveredRate)}</td>
                    <td className="p-2 text-right">{percentLabel(instance.readRate)}</td>
                    <td className="p-2 text-right">{secondsToLabel(instance.responseTime)}</td>
                    <td className="p-2 text-right">{fmtNum(instance.activeChats)}</td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center text-text2 p-4">
                    Nenhuma instância com dados no dia selecionado.
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
