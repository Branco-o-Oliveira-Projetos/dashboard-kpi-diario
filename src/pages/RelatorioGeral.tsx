import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { fetchKpis, fetchSeries } from '../lib/api'
import { fmtMoney, fmtNum } from '../lib/format'
import { SYSTEM_ORDER, SYSTEMS } from '../lib/systems'
import type { SeriesPoint, SystemKey } from '../types'

type PredictionPoint = { date: string; value: number }

type PredictionSummary = {
  future: PredictionPoint[]
  total: number
  average: number
  trendPerDay: number
}

type SeriesAnalytics = {
  total: number
  average: number
  lastValue: number
  previousValue: number | null
  bestDay: PredictionPoint | null
  worstDay: PredictionPoint | null
  last7Average: number
}

type Insight = {
  label: string
  value: string
}

const FUTURE_DAYS = 7

const formatDateLabel = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const isMoneySystem = (system: SystemKey) => SYSTEMS[system].title.includes('R$')

const formatNumber = (system: SystemKey, value: number, digits = 0) => {
  if (!Number.isFinite(value)) return '--'
  if (isMoneySystem(system)) {
    return fmtMoney(value)
  }
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })
}

const formatPercentage = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return '--'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

const computeAnalytics = (points: SeriesPoint[]): SeriesAnalytics => {
  const values = points.map(point => Number(point.y ?? 0))
  const total = values.reduce((acc, value) => acc + value, 0)
  const average = values.length ? total / values.length : 0
  const lastValue = values.length ? values[values.length - 1] : 0
  const previousValue = values.length > 1 ? values[values.length - 2] : null
  const last7 = values.slice(-7)
  const last7Average = last7.length ? last7.reduce((acc, value) => acc + value, 0) / last7.length : 0

  let bestDay: PredictionPoint | null = null
  let worstDay: PredictionPoint | null = null

  points.forEach(point => {
    const value = Number(point.y ?? 0)
    if (bestDay === null || value > bestDay.value) {
      bestDay = { date: point.x, value }
    }
    if (worstDay === null || value < worstDay.value) {
      worstDay = { date: point.x, value }
    }
  })

  return {
    total,
    average,
    lastValue,
    previousValue,
    bestDay,
    worstDay,
    last7Average
  }
}

const computePrediction = (points: SeriesPoint[], futureDays = FUTURE_DAYS): PredictionSummary => {
  const values = points.map(point => Number(point.y ?? 0))

  if (!values.length) {
    return { future: [], total: 0, average: 0, trendPerDay: 0 }
  }

  const n = values.length
  const indices = values.map((_, index) => index)

  const sumX = indices.reduce((acc, value) => acc + value, 0)
  const sumY = values.reduce((acc, value) => acc + value, 0)
  const sumXY = indices.reduce((acc, value, index) => acc + value * values[index], 0)
  const sumXX = indices.reduce((acc, value) => acc + value * value, 0)

  const denominator = n * sumXX - sumX * sumX
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0
  const intercept = (sumY - slope * sumX) / n

  const lastDate = new Date(points[points.length - 1].x)

  const future: PredictionPoint[] = []
  for (let i = 1; i <= futureDays; i++) {
    const x = n - 1 + i
    const predicted = Math.max(0, slope * x + intercept)
    const date = addDays(lastDate, i).toISOString().split('T')[0]
    future.push({ date, value: predicted })
  }

  const total = future.reduce((acc, point) => acc + point.value, 0)
  const average = futureDays ? total / futureDays : 0

  return { future, total, average, trendPerDay: slope }
}

const buildInsights = (
  system: SystemKey,
  analytics: SeriesAnalytics,
  prediction: PredictionSummary
): Insight[] => {
  const insights: Insight[] = []
  const { bestDay, worstDay, average, lastValue, previousValue, last7Average } = analytics
  const isMoney = isMoneySystem(system)

  if (bestDay) {
    insights.push({
      label: 'Melhor dia recente',
      value: `${formatDateLabel(bestDay.date)} • ${
        isMoney ? fmtMoney(bestDay.value) : fmtNum(bestDay.value)
      }`
    })
  }

  if (worstDay) {
    insights.push({
      label: 'Dia de menor resultado',
      value: `${formatDateLabel(worstDay.date)} • ${
        isMoney ? fmtMoney(worstDay.value) : fmtNum(worstDay.value)
      }`
    })
  }

  if (previousValue !== null && previousValue !== 0) {
    const delta = ((lastValue - previousValue) / previousValue) * 100
    insights.push({
      label: 'Variação último dia vs anterior',
      value: formatPercentage(delta)
    })
  } else {
    insights.push({
      label: 'Média 14 dias',
      value: formatNumber(system, average, isMoney ? 2 : 1)
    })
  }

  if (last7Average > 0) {
    const deltaAvg = ((prediction.average - last7Average) / last7Average) * 100
    insights.push({
      label: 'Tendência para próximos 7 dias',
      value: formatPercentage(deltaAvg)
    })
  }

  return insights
}

const buildChartData = (points: SeriesPoint[], future: PredictionPoint[]) => {
  const actual = points.map(point => ({
    date: point.x,
    actual: Number(point.y ?? 0),
    predicted: null
  }))

  const forecast = future.map(point => ({
    date: point.date,
    actual: null,
    predicted: point.value
  }))

  return [...actual, ...forecast]
}

function MetricTile({
  label,
  value
}: {
  label: string
  value: string
}) {
  return (
    <motion.div
      className="p-2 sm:p-3 bg-white/5 border border-white/10 rounded-lg text-center shadow-inner shadow-black/30"
      whileHover={{ scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 240 }}
    >
      <div className="text-sm sm:text-base font-semibold text-neonAqua">{value}</div>
      <div className="text-[0.65rem] sm:text-xs text-text2 mt-1">{label}</div>
    </motion.div>
  )
}

export default function RelatorioGeral() {
  const seriesQueries = useQueries({
    queries: SYSTEM_ORDER.map(system => ({
      queryKey: ['report', 'series', system],
      queryFn: () => fetchSeries(system),
      refetchInterval: 3 * 60 * 1000
    }))
  })

  const kpiQueries = useQueries({
    queries: SYSTEM_ORDER.map(system => ({
      queryKey: ['report', 'kpis', system],
      queryFn: () => fetchKpis(system),
      refetchInterval: 3 * 60 * 1000
    }))
  })

  const isLoading =
    seriesQueries.some(query => query.isLoading) || kpiQueries.some(query => query.isLoading)
  const hasError =
    seriesQueries.some(query => query.isError) || kpiQueries.some(query => query.isError)

  const cards = useMemo(() => {
    return SYSTEM_ORDER.map((system, index) => {
      const series = seriesQueries[index].data?.points ?? []
      const kpis = kpiQueries[index].data
      const analytics = computeAnalytics(series)
      const prediction = computePrediction(series)
      const chartData = buildChartData(series, prediction.future)
      const insights = buildInsights(system, analytics, prediction)

      const variation =
        analytics.previousValue && analytics.previousValue !== 0
          ? ((analytics.lastValue - analytics.previousValue) / analytics.previousValue) * 100
          : null

      const summaryMetrics = [
        {
          label: 'Total últimos 14 dias',
          value: formatNumber(system, analytics.total, isMoneySystem(system) ? 2 : 0)
        },
        {
          label: 'Média diária (14d)',
          value: formatNumber(system, analytics.average, isMoneySystem(system) ? 2 : 1)
        },
        {
          label: 'Resultado último dia',
          value: formatNumber(system, analytics.lastValue, isMoneySystem(system) ? 2 : 0)
        },
        {
          label: 'Estimativa próximos 7 dias',
          value: formatNumber(system, prediction.total, isMoneySystem(system) ? 2 : 0)
        }
      ]

      const updatedLabel = kpis?.updatedAt
        ? new Date(kpis.updatedAt).toLocaleString('pt-BR')
        : '--'

      return {
        system,
        chartData,
        insights,
        summaryMetrics,
        updatedLabel,
        variation
      }
    })
  }, [kpiQueries, seriesQueries])

  return (
    <div className="min-h-screen bg-bg text-text px-4 sm:px-6 lg:px-8 py-6">
      <motion.div
        className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <motion.h1
            className="text-2xl sm:text-3xl font-semibold text-text"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Relatório Geral • Últimos 14 dias
          </motion.h1>
          <motion.p
            className="text-text2 text-sm sm:text-base mt-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Visão consolidada de todos os sistemas, com tendências recentes e previsão dos próximos 7 dias.
          </motion.p>
        </div>
        <motion.div
          className="flex items-center gap-2 text-xs sm:text-sm text-text2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span>Precisa de detalhes específicos?</span>
          <Link to="/" className="text-neonAqua font-semibold">
            Voltar ao dashboard principal
          </Link>
        </motion.div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-text2">
          Carregando relatório consolidado...
        </div>
      ) : hasError ? (
        <div className="flex items-center justify-center py-20 text-neonPink">
          Não foi possível carregar os dados. Tente novamente em instantes.
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6">
          {cards.map(card => {
            const systemInfo = SYSTEMS[card.system]
            const variationLabel =
              card.variation !== null ? formatPercentage(card.variation ?? null) : '--'

            return (
              <motion.div
                key={card.system}
                className="card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-4">
                  <div>
                    <motion.h2
                      className="card-title mb-1"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {systemInfo.title}
                    </motion.h2>
                    <div className="text-xs text-text2">
                      Atualizado em: <span className="text-text">{card.updatedLabel}</span>
                    </div>
                  </div>
                  <motion.div
                    className="text-xs sm:text-sm text-text2 flex items-center gap-2"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <span>Tendência vs dia anterior:</span>
                    <span
                      className={`font-semibold ${
                        card.variation !== null && (card.variation ?? 0) >= 0
                          ? 'text-emerald-300'
                          : 'text-neonPink'
                      }`}
                    >
                      {variationLabel}
                    </span>
                  </motion.div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
                  {card.summaryMetrics.map(metric => (
                    <MetricTile key={metric.label} label={metric.label} value={metric.value} />
                  ))}
                </div>

                <motion.div
                  className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 sm:gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-text">Evolução 14d + previsão</span>
                      <span className="text-xs text-text2">Próximos {FUTURE_DAYS} dias projetados</span>
                    </div>
                    <div className="h-60 sm:h-72">
                      {card.chartData.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={card.chartData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis
                              dataKey="date"
                              tickFormatter={formatDateLabel}
                              fontSize={10}
                              padding={{ left: 10, right: 10 }}
                            />
                            <YAxis
                              fontSize={10}
                              tickFormatter={value =>
                                isMoneySystem(card.system)
                                  ? fmtMoney(value as number)
                                  : fmtNum(value as number)
                              }
                              width={isMoneySystem(card.system) ? 90 : 60}
                            />
                            <Tooltip
                              labelFormatter={formatDateLabel}
                              formatter={(value, name) => {
                                if (name === 'predicted') {
                                  return [
                                    isMoneySystem(card.system)
                                      ? fmtMoney(value as number)
                                      : fmtNum(value as number),
                                    'Estimativa'
                                  ]
                                }
                                return [
                                  isMoneySystem(card.system)
                                    ? fmtMoney(value as number)
                                    : fmtNum(value as number),
                                  'Realizado'
                                ]
                              }}
                            />
                            <Legend
                              formatter={value => (value === 'actual' ? 'Realizado' : 'Estimativa')}
                            />
                            <Bar
                              dataKey="actual"
                              fill="#22D3EE"
                              radius={[4, 4, 0, 0]}
                              name="Realizado"
                            />
                            <Line
                              type="monotone"
                              dataKey="predicted"
                              stroke="#F97316"
                              strokeWidth={3}
                              strokeDasharray="6 4"
                              dot={{ r: 2 }}
                              name="Estimativa"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-text2 text-sm">
                          Ainda não há dados suficientes para montar a visão.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-sm font-semibold text-text block mb-2">Insights rápidos</span>
                    <ul className="space-y-2 text-xs sm:text-sm text-text2">
                      {card.insights.map(item => (
                        <li key={item.label}>
                          <span className="text-text">{item.label}:</span> {item.value}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
