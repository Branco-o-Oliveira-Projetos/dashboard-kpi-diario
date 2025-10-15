import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { fetchDetailedData, fetchPiperunAllPipelines } from '../lib/api'
import { fmtMoney, fmtNum } from '../lib/format'
import { SYSTEMS } from '../lib/systems'

type NumericLike = number | string | null | undefined

interface MetaAdsRecord {
  ref_date: string
  leads: number
}

interface GoogleAdsRecord {
  ref_date: string
  leads: number
}

interface ContaAzulRaw {
  ref_date: string
  recebiveisHojeValor: NumericLike
  entradaValor: NumericLike
  recebiveis7DiasValor: NumericLike
  pagaveis7DiasValor: NumericLike
  inadimplentesValor: NumericLike
  inadimplentesQuant: NumericLike
  updated_at?: string
}

interface ContaAzulRecord {
  ref_date: string
  recebiveisHojeValor: number
  entradaValor: number
  recebiveis7DiasValor: number
  pagaveis7DiasValor: number
  inadimplentesValor: number
  inadimplentesQuant: number
  updated_at: string
}

interface PiperunRecord {
  ref_date: string
  pipeline_name: string
  oportunidades_recebidas: number
  oportunidades_ganhas: number
  updated_at?: string
}

type DailyValue = { date: string; value: number }
type ContaDailyPoint = { date: string; receber: number; recebido: number }
type PipelineDailyPoint = { date: string; recebidas: number; ganhas: number }

type DailyStats = {
  total: number
  average: number
  last: DailyValue | null
  previous: DailyValue | null
  best: DailyValue | null
  worst: DailyValue | null
}

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Marco',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
]

const TARGET_PIPELINE = '00. PRE-RECEPTIVO BRANCO'
const TARGET_PIPELINE_KEY = normalizeText(TARGET_PIPELINE)

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function toNumber(value: NumericLike): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/\s/g, '').replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function normalizeContaAzul(record: ContaAzulRaw): ContaAzulRecord {
  return {
    ref_date: record.ref_date,
    recebiveisHojeValor: toNumber(record.recebiveisHojeValor),
    entradaValor: toNumber(record.entradaValor),
    recebiveis7DiasValor: toNumber(record.recebiveis7DiasValor),
    pagaveis7DiasValor: toNumber(record.pagaveis7DiasValor),
    inadimplentesValor: toNumber(record.inadimplentesValor),
    inadimplentesQuant: toNumber(record.inadimplentesQuant),
    updated_at: record.updated_at ?? ''
  }
}

function getMonthKey(date: string | undefined): string | null {
  if (!date) return null
  const iso = date.includes('T') ? date.split('T')[0] : date
  const [year, month] = iso.split('-')
  if (!year || !month) return null
  return `${year}-${month}`
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const monthIndex = Number(month) - 1
  const monthName = MONTH_LABELS[monthIndex] ?? month
  return `${monthName} / ${year}`
}

function formatDateLabel(value: string): string {
  const normalized = value.includes('T') ? value : `${value}T00:00:00`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function buildDailySeries<T>(
  records: T[],
  valueFn: (record: T) => number,
  dateFn: (record: T) => string
): DailyValue[] {
  const map = new Map<string, number>()
  records.forEach(record => {
    const date = dateFn(record)
    if (!date) return
    const key = date.includes('T') ? date.split('T')[0] : date
    const current = map.get(key) ?? 0
    map.set(key, current + valueFn(record))
  })
  return Array.from(map.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, value]) => ({ date, value }))
}

function computeDailyStats(series: DailyValue[]): DailyStats {
  if (!series.length) {
    return { total: 0, average: 0, last: null, previous: null, best: null, worst: null }
  }

  const total = series.reduce((acc, point) => acc + point.value, 0)
  const average = total / series.length
  const previous = series.length > 1 ? series[series.length - 2] : null
  const best = series.reduce(
    (acc: DailyValue | null, point) => (acc === null || point.value > acc.value ? point : acc),
    null
  )
  const worst = series.reduce(
    (acc: DailyValue | null, point) => (acc === null || point.value < acc.value ? point : acc),
    null
  )

  return {
    total,
    average,
    last: series[series.length - 1] ?? null,
    previous,
    best,
    worst
  }
}

function formatDecimal(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '--'
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })
}

function formatPercentage(value: number): string {
  if (!Number.isFinite(value)) return '--'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

function computeDeltaPercent(current: number | null | undefined, base: number | null | undefined) {
  if (current == null || base == null || base === 0) return null
  return ((current - base) / base) * 100
}

function MetricTile({ label, value }: { label: string; value: string }) {
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
  const metaAdsQuery = useQuery({
    queryKey: ['relatorio-geral', 'meta-ads'],
    queryFn: () => fetchDetailedData('meta_ads'),
    refetchInterval: 3 * 60 * 1000
  })

  const googleAdsQuery = useQuery({
    queryKey: ['relatorio-geral', 'google-ads'],
    queryFn: () => fetchDetailedData('google_ads'),
    refetchInterval: 3 * 60 * 1000
  })

  const contaAzulQuery = useQuery({
    queryKey: ['relatorio-geral', 'conta-azul'],
    queryFn: () => fetchDetailedData('conta_azul'),
    refetchInterval: 3 * 60 * 1000
  })

  const piperunQuery = useQuery({
    queryKey: ['relatorio-geral', 'piperun'],
    queryFn: () => fetchPiperunAllPipelines(),
    refetchInterval: 3 * 60 * 1000
  })

  const metaRecords = useMemo<MetaAdsRecord[]>(() => {
    if (!Array.isArray(metaAdsQuery.data)) return []
    return (metaAdsQuery.data as MetaAdsRecord[]).filter(item => !!item?.ref_date)
  }, [metaAdsQuery.data])

  const googleRecords = useMemo<GoogleAdsRecord[]>(() => {
    if (!Array.isArray(googleAdsQuery.data)) return []
    return (googleAdsQuery.data as GoogleAdsRecord[]).filter(item => !!item?.ref_date)
  }, [googleAdsQuery.data])

  const contaRecords = useMemo<ContaAzulRecord[]>(() => {
    if (!Array.isArray(contaAzulQuery.data)) return []
    return (contaAzulQuery.data as ContaAzulRaw[])
      .filter(item => !!item?.ref_date)
      .map(normalizeContaAzul)
  }, [contaAzulQuery.data])

  const piperunRecords = useMemo<PiperunRecord[]>(() => {
    if (!Array.isArray(piperunQuery.data)) return []
    return (piperunQuery.data as PiperunRecord[]).filter(item => !!item?.ref_date)
  }, [piperunQuery.data])

  const monthOptions = useMemo(() => {
    const months = new Set<string>()
    ;[metaRecords, googleRecords, contaRecords, piperunRecords].forEach(list => {
      list.forEach(item => {
        const month = getMonthKey((item as any).ref_date)
        if (month) months.add(month)
      })
    })
    return Array.from(months).sort((a, b) => b.localeCompare(a))
  }, [metaRecords, googleRecords, contaRecords, piperunRecords])

  const [selectedMonth, setSelectedMonth] = useState<string>('')

  useEffect(() => {
    if (!selectedMonth && monthOptions.length) {
      setSelectedMonth(monthOptions[0])
    } else if (selectedMonth && !monthOptions.includes(selectedMonth)) {
      setSelectedMonth(monthOptions[0] ?? '')
    }
  }, [monthOptions, selectedMonth])

  const filterByMonth = <T extends { ref_date: string }>(records: T[]) => {
    if (!selectedMonth) return []
    return records.filter(record => record.ref_date?.startsWith(selectedMonth))
  }

  const metaMonthly = useMemo(() => filterByMonth(metaRecords), [metaRecords, selectedMonth])
  const googleMonthly = useMemo(() => filterByMonth(googleRecords), [googleRecords, selectedMonth])
  const contaMonthly = useMemo(() => filterByMonth(contaRecords), [contaRecords, selectedMonth])
  const piperunMonthly = useMemo(() => filterByMonth(piperunRecords), [piperunRecords, selectedMonth])

  const metaDaily = useMemo(
    () => buildDailySeries(metaMonthly, record => record.leads ?? 0, record => record.ref_date),
    [metaMonthly]
  )
  const googleDaily = useMemo(
    () => buildDailySeries(googleMonthly, record => record.leads ?? 0, record => record.ref_date),
    [googleMonthly]
  )

  const contaDaily = useMemo<ContaDailyPoint[]>(() => {
    const map = new Map<string, { receber: number; recebido: number }>()
    contaMonthly.forEach(record => {
      const key = record.ref_date.includes('T') ? record.ref_date.split('T')[0] : record.ref_date
      const current = map.get(key) ?? { receber: 0, recebido: 0 }
      current.receber = record.recebiveisHojeValor
      current.recebido += record.entradaValor
      map.set(key, current)
    })
    return Array.from(map.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, values]) => ({ date, receber: values.receber, recebido: values.recebido }))
  }, [contaMonthly])

  const contaRecebidoStats = useMemo(
    () => computeDailyStats(contaDaily.map(point => ({ date: point.date, value: point.recebido }))),
    [contaDaily]
  )
  const contaReceberStats = useMemo(
    () => computeDailyStats(contaDaily.map(point => ({ date: point.date, value: point.receber }))),
    [contaDaily]
  )

  const contaLatest = useMemo(() => {
    if (!contaMonthly.length) return null
    const toTimestamp = (value: string | undefined) => {
      if (!value) return Number.NEGATIVE_INFINITY
      const normalized = value.includes('T') ? value : `${value}T00:00:00`
      const ts = new Date(normalized).getTime()
      return Number.isFinite(ts) ? ts : Number.NEGATIVE_INFINITY
    }

    return contaMonthly.reduce<ContaAzulRecord | null>((latest, record) => {
      if (!latest) return record
      const currentDate = toTimestamp(record.ref_date)
      const latestDate = toTimestamp(latest.ref_date)

      if (currentDate > latestDate) return record
      if (currentDate < latestDate) return latest

      const currentUpdated = toTimestamp(record.updated_at)
      const latestUpdated = toTimestamp(latest.updated_at)
      if (currentUpdated > latestUpdated) return record
      return latest
    }, null)
  }, [contaMonthly])

  const targetPipelineRecords = useMemo(() => {
    return piperunMonthly.filter(record => normalizeText(record.pipeline_name) === TARGET_PIPELINE_KEY)
  }, [piperunMonthly])

  const pipelineDaily = useMemo<PipelineDailyPoint[]>(() => {
    const map = new Map<string, { recebidas: number; ganhas: number }>()
    targetPipelineRecords.forEach(record => {
      const key = record.ref_date.includes('T') ? record.ref_date.split('T')[0] : record.ref_date
      const current = map.get(key) ?? { recebidas: 0, ganhas: 0 }
      current.recebidas += record.oportunidades_recebidas ?? 0
      current.ganhas += record.oportunidades_ganhas ?? 0
      map.set(key, current)
    })
    return Array.from(map.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, values]) => ({ date, recebidas: values.recebidas, ganhas: values.ganhas }))
  }, [targetPipelineRecords])

  const pipelineRecebidasStats = useMemo(
    () => computeDailyStats(pipelineDaily.map(point => ({ date: point.date, value: point.recebidas }))),
    [pipelineDaily]
  )
  const pipelineGanhasStats = useMemo(
    () => computeDailyStats(pipelineDaily.map(point => ({ date: point.date, value: point.ganhas }))),
    [pipelineDaily]
  )

  const pipelineConversion = useMemo(() => {
    const totalRecebidas = pipelineRecebidasStats.total
    const totalGanhas = pipelineGanhasStats.total
    if (!totalRecebidas) return 0
    return (totalGanhas / totalRecebidas) * 100
  }, [pipelineRecebidasStats.total, pipelineGanhasStats.total])

  const isLoading =
    metaAdsQuery.isLoading ||
    googleAdsQuery.isLoading ||
    contaAzulQuery.isLoading ||
    piperunQuery.isLoading

  const hasError =
    metaAdsQuery.isError ||
    googleAdsQuery.isError ||
    contaAzulQuery.isError ||
    piperunQuery.isError

  const metaStats = useMemo(() => computeDailyStats(metaDaily), [metaDaily])
  const googleStats = useMemo(() => computeDailyStats(googleDaily), [googleDaily])
  const metaDeltaAvg = metaStats.last ? computeDeltaPercent(metaStats.last.value, metaStats.average) : null
  const metaDeltaPrev =
    metaStats.last && metaStats.previous ? computeDeltaPercent(metaStats.last.value, metaStats.previous.value) : null
  const googleDeltaAvg = googleStats.last
    ? computeDeltaPercent(googleStats.last.value, googleStats.average)
    : null
  const googleDeltaPrev =
    googleStats.last && googleStats.previous
      ? computeDeltaPercent(googleStats.last.value, googleStats.previous.value)
      : null
  const pipelineDeltaPrev =
    pipelineRecebidasStats.last && pipelineRecebidasStats.previous
      ? computeDeltaPercent(pipelineRecebidasStats.last.value, pipelineRecebidasStats.previous.value)
      : null

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
            Relatorio Geral
          </motion.h1>
          <motion.p
            className="text-text2 text-sm sm:text-base mt-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Consolidacao dos principais indicadores dos sistemas, com filtro mensal.
          </motion.p>
        </div>
        <motion.div
          className="flex items-center gap-2 text-xs sm:text-sm text-text2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span>Precisa de detalhes especificos?</span>
          <Link to="/" className="text-neonAqua font-semibold">
            Voltar ao dashboard principal
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <label className="text-sm text-text2">
          Selecionar mes:
          <select
            className="ml-2 bg-bg2 border border-white/10 rounded-md px-3 py-2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-neonAqua/60"
            value={selectedMonth}
            onChange={event => setSelectedMonth(event.target.value)}
            disabled={!monthOptions.length}
          >
            {!monthOptions.length && <option>Carregando...</option>}
            {monthOptions.map(month => (
              <option key={month} value={month}>
                {formatMonthLabel(month)}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-text2">
          {monthOptions.length
            ? `Periodos disponiveis: ${monthOptions.length}`
            : 'Aguardando dados para habilitar o filtro.'}
        </span>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-text2">
          Carregando relatorio consolidado...
        </div>
      ) : hasError ? (
        <div className="flex items-center justify-center py-20 text-neonPink">
          Nao foi possivel carregar os dados. Tente novamente em instantes.
        </div>
      ) : !selectedMonth ? (
        <div className="flex items-center justify-center py-20 text-text2">
          Aguardando dados para montar o relatorio geral.
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6">
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -4 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-4">
              <div>
                <h2 className="card-title mb-1">{SYSTEMS.meta_ads.title}</h2>
                <span className="text-xs text-text2">Mes selecionado: {formatMonthLabel(selectedMonth)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
              <MetricTile label="Leads no mes" value={fmtNum(metaStats.total)} />
              <MetricTile label="Media diaria de leads" value={formatDecimal(metaStats.average)} />
              <MetricTile
                label="Leads ultimo dia"
                value={metaStats.last ? fmtNum(metaStats.last.value) : '--'}
              />
              <MetricTile
                label="Maior volume diario"
                value={metaStats.best ? fmtNum(metaStats.best.value) : '--'}
              />
            </div>

            <motion.div
              className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 sm:gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text">Leads gerados por dia</span>
                </div>
                <div className="h-56 sm:h-64">
                  {metaDaily.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={metaDaily}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="date" tickFormatter={formatDateLabel} fontSize={10} />
                        <YAxis fontSize={10} tickFormatter={value => fmtNum(value as number)} />
                        <Tooltip
                          labelFormatter={formatDateLabel}
                          formatter={(value: number) => [fmtNum(value), 'Leads']}
                        />
                        <Bar dataKey="value" fill="#22D3EE" radius={[4, 4, 0, 0]} name="Leads" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-text2 text-sm">
                      Nao ha registros para este periodo.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="text-sm font-semibold text-text block mb-2">Insights rapidos</span>

                <ul className="space-y-2 text-xs sm:text-sm text-text2">
                  <li>
                    <span className="text-text">Total de leads no periodo:</span>{' '}
                    {fmtNum(metaStats.total)}
                  </li>
                  <li>
                    <span className="text-text">Media diaria do periodo:</span>{' '}
                    {formatDecimal(metaStats.average)}
                  </li>
                  {metaDeltaAvg !== null && (
                    <li>
                      <span className="text-text">Ultimo dia vs media:</span>{' '}
                      {formatPercentage(metaDeltaAvg)}
                    </li>
                  )}
                  {metaDeltaPrev !== null && (
                    <li>
                      <span className="text-text">Ultimo dia vs dia anterior:</span>{' '}
                      {formatPercentage(metaDeltaPrev)}
                    </li>
                  )}
                  {metaStats.best && (
                    <li>
                      <span className="text-text">Dia com maior geracao:</span>{' '}
                      {formatDateLabel(metaStats.best.date)} - {fmtNum(metaStats.best.value)} leads
                    </li>
                  )}
                  {metaStats.worst && (
                    <li>
                      <span className="text-text">Dia de menor geracao:</span>{' '}
                      {formatDateLabel(metaStats.worst.date)} - {fmtNum(metaStats.worst.value)} leads
                    </li>
                  )}
                  {metaStats.last && (
                    <li>
                      <span className="text-text">UUltima atualizacao:</span>{' '}
                      {formatDateLabel(metaStats.last.date)} - {fmtNum(metaStats.last.value)} leads
                    </li>
                  )}
                </ul>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            whileHover={{ y: -4 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-4">
              <div>
                <h2 className="card-title mb-1">{SYSTEMS.google_ads.title}</h2>
                <span className="text-xs text-text2">Mes selecionado: {formatMonthLabel(selectedMonth)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
              <MetricTile label="Leads no mes" value={fmtNum(googleStats.total)} />
              <MetricTile label="Media diaria de leads" value={formatDecimal(googleStats.average)} />
              <MetricTile
                label="Leads ultimo dia"
                value={googleStats.last ? fmtNum(googleStats.last.value) : '--'}
              />
              <MetricTile
                label="Maior volume diario"
                value={googleStats.best ? fmtNum(googleStats.best.value) : '--'}
              />
            </div>

            <motion.div
              className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 sm:gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text">Leads gerados por dia</span>
                </div>
                <div className="h-56 sm:h-64">
                  {googleDaily.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={googleDaily}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="date" tickFormatter={formatDateLabel} fontSize={10} />
                        <YAxis fontSize={10} tickFormatter={value => fmtNum(value as number)} />
                        <Tooltip
                          labelFormatter={formatDateLabel}
                          formatter={(value: number) => [fmtNum(value), 'Leads']}
                        />
                        <Bar dataKey="value" fill="#38BDF8" radius={[4, 4, 0, 0]} name="Leads" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-text2 text-sm">
                      Nao ha registros para este periodo.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="text-sm font-semibold text-text block mb-2">Insights rapidos</span>

                <ul className="space-y-2 text-xs sm:text-sm text-text2">
                  <li>
                    <span className="text-text">Total de leads no periodo:</span>{' '}
                    {fmtNum(googleStats.total)}
                  </li>
                  <li>
                    <span className="text-text">Media diaria do periodo:</span>{' '}
                    {formatDecimal(googleStats.average)}
                  </li>
                  {googleDeltaAvg !== null && (
                    <li>
                      <span className="text-text">Ultimo dia vs media:</span>{' '}
                      {formatPercentage(googleDeltaAvg)}
                    </li>
                  )}
                  {googleDeltaPrev !== null && (
                    <li>
                      <span className="text-text">Ultimo dia vs dia anterior:</span>{' '}
                      {formatPercentage(googleDeltaPrev)}
                    </li>
                  )}
                  {googleStats.best && (
                    <li>
                      <span className="text-text">Dia com maior geracao:</span>{' '}
                      {formatDateLabel(googleStats.best.date)} - {fmtNum(googleStats.best.value)} leads
                    </li>
                  )}
                  {googleStats.worst && (
                    <li>
                      <span className="text-text">Dia de menor geracao:</span>{' '}
                      {formatDateLabel(googleStats.worst.date)} - {fmtNum(googleStats.worst.value)} leads
                    </li>
                  )}
                  {googleStats.last && (
                    <li>
                      <span className="text-text">UUltima atualizacao:</span>{' '}
                      {formatDateLabel(googleStats.last.date)} - {fmtNum(googleStats.last.value)} leads
                    </li>
                  )}
                </ul>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -4 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-4">
              <div>
                <h2 className="card-title mb-1">{SYSTEMS.conta_azul.title}</h2>
                <span className="text-xs text-text2">Mes selecionado: {formatMonthLabel(selectedMonth)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
              <MetricTile
                label="Total recebido no mes"
                value={fmtMoney(contaRecebidoStats.total)}
              />
              <MetricTile
                label="Media diaria recebida"
                value={fmtMoney(contaRecebidoStats.average)}
              />
              <MetricTile
                label="Valor recebido (ultimo dia)"
                value={
                  contaRecebidoStats.last ? fmtMoney(contaRecebidoStats.last.value) : fmtMoney(0)
                }
              />
              <MetricTile
                label="Maior saldo a receber"
                value={contaReceberStats.best ? fmtMoney(contaReceberStats.best.value) : '--'}
              />
            </div>

            <motion.div
              className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 sm:gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text">Fluxo financeiro dirio</span>
                </div>
                <div className="h-56 sm:h-64">
                  {contaDaily.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={contaDaily}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="date" tickFormatter={formatDateLabel} fontSize={10} />
                        <YAxis
                          fontSize={10}
                          tickFormatter={value => fmtMoney(value as number)}
                          width={100}
                        />
                        <Tooltip
                          labelFormatter={formatDateLabel}
                          formatter={(value: number, name) => {
                            if (name === 'receber') return [fmtMoney(value), 'Saldo a receber']
                            return [fmtMoney(value), 'Recebido']
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="recebido"
                          fill="#22C55E"
                          radius={[4, 4, 0, 0]}
                          name="Recebido"
                        />
                        <Line
                          type="monotone"
                          dataKey="receber"
                          stroke="#F97316"
                          strokeWidth={3}
                          dot={{ r: 2 }}
                          name="Saldo a receber"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-text2 text-sm">
                      Nao ha registros para este periodo.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="text-sm font-semibold text-text block mb-2">Insights rapidos</span>
                <ul className="space-y-2 text-xs sm:text-sm text-text2">
                  {contaReceberStats.last && (
                    <li>
                      <span className="text-text">Saldo atual a receber:</span>{' '}
                      {formatDateLabel(contaReceberStats.last.date)} - {fmtMoney(contaReceberStats.last.value)}
                    </li>
                  )}
                  <li>
                    <span className="text-text">Media diaria recebida:</span>{' '}
                    {fmtMoney(contaRecebidoStats.average)}
                  </li>
                  {contaLatest && (
                    <li>
                      <span className="text-text">Valor inadimplente (mes):</span>{' '}
                      {fmtMoney(contaLatest.inadimplentesValor)}
                    </li>
                  )}
                  {contaLatest && (
                    <li>
                      <span className="text-text">Clientes inadimplentes:</span>{' '}
                      {fmtNum(contaLatest.inadimplentesQuant)}
                    </li>
                  )}
                  {contaLatest && (
                    <li>
                      <span className="text-text">Recebiveis proximos 7 dias:</span>{' '}
                      {fmtMoney(contaLatest.recebiveis7DiasValor)}
                    </li>
                  )}
                  {contaLatest && (
                    <li>
                      <span className="text-text">Pagaveis proximos 7 dias:</span>{' '}
                      {fmtMoney(contaLatest.pagaveis7DiasValor)}
                    </li>
                  )}
                  {contaRecebidoStats.best && (
                    <li>
                      <span className="text-text">Dia de maior recebimento:</span>{' '}
                      {formatDateLabel(contaRecebidoStats.best.date)} - {fmtMoney(contaRecebidoStats.best.value)}
                    </li>
                  )}
                  {contaReceberStats.best && (
                    <li>
                      <span className="text-text">Maior saldo projetado:</span>{' '}
                      {formatDateLabel(contaReceberStats.best.date)} - {fmtMoney(contaReceberStats.best.value)}
                    </li>
                  )}
                  {contaRecebidoStats.last && (
                    <li>
                      <span className="text-text">Ultima entrada registrada:</span>{' '}
                      {formatDateLabel(contaRecebidoStats.last.date)} - {fmtMoney(contaRecebidoStats.last.value)}
                    </li>
                  )}
                </ul>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            whileHover={{ y: -4 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-4">
              <div>
                <h2 className="card-title mb-1">
                  {SYSTEMS.piperun.title} - {TARGET_PIPELINE}
                </h2>
                <span className="text-xs text-text2">Mes selecionado: {formatMonthLabel(selectedMonth)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
              <MetricTile label="Recebidas no mes" value={fmtNum(pipelineRecebidasStats.total)} />
              <MetricTile label="Ganhos no mes" value={fmtNum(pipelineGanhasStats.total)} />
              <MetricTile
                label="Taxa de conversao"
                value={formatPercentage(pipelineConversion)}
              />
              <MetricTile
                label="Recebidas ultimo dia"
                value={pipelineRecebidasStats.last ? fmtNum(pipelineRecebidasStats.last.value) : '--'}
              />
            </div>

            <motion.div
              className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 sm:gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text">
                    Oportunidades recebidas vs ganhas
                  </span>
                </div>
                <div className="h-56 sm:h-64">
                  {pipelineDaily.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={pipelineDaily}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="date" tickFormatter={formatDateLabel} fontSize={10} />
                        <YAxis fontSize={10} tickFormatter={value => fmtNum(value as number)} />
                        <Tooltip
                          labelFormatter={formatDateLabel}
                          formatter={(value: number, name) => {
                            if (name === 'ganhas') return [fmtNum(value), 'Ganhas']
                            return [fmtNum(value), 'Recebidas']
                          }}
                        />
                        <Legend formatter={value => (value === 'ganhas' ? 'Ganhas' : 'Recebidas')} />
                        <Bar
                          dataKey="recebidas"
                          fill="#818CF8"
                          radius={[4, 4, 0, 0]}
                          name="Recebidas"
                        />
                        <Line
                          type="monotone"
                          dataKey="ganhas"
                          stroke="#22C55E"
                          strokeWidth={3}
                          dot={{ r: 2 }}
                          name="Ganhas"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-text2 text-sm">
                      Nao ha registros para este periodo.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="text-sm font-semibold text-text block mb-2">Insights rapidos</span>

                <ul className="space-y-2 text-xs sm:text-sm text-text2">
                  <li>
                    <span className="text-text">Total recebidas no periodo:</span>{' '}
                    {fmtNum(pipelineRecebidasStats.total)}
                  </li>
                  <li>
                    <span className="text-text">Total ganhas no periodo:</span>{' '}
                    {fmtNum(pipelineGanhasStats.total)}
                  </li>
                  <li>
                    <span className="text-text">Media diaria recebidas:</span>{' '}
                    {formatDecimal(pipelineRecebidasStats.average)}
                  </li>
                  <li>
                    <span className="text-text">Media diaria ganhas:</span>{' '}
                    {formatDecimal(pipelineGanhasStats.average)}
                  </li>
                  {pipelineRecebidasStats.last && (
                    <li>
                      <span className="text-text">Ultimo dia registrado:</span>{' '}
                      {formatDateLabel(pipelineRecebidasStats.last.date)} - {fmtNum(pipelineRecebidasStats.last.value)} recebidas
                    </li>
                  )}
                  {pipelineDeltaPrev !== null && (
                    <li>
                      <span className="text-text">Tendencia vs dia anterior (recebidas):</span>{' '}
                      {formatPercentage(pipelineDeltaPrev)}
                    </li>
                  )}
                  {pipelineRecebidasStats.best && (
                    <li>
                      <span className="text-text">Dia com mais oportunidades:</span>{' '}
                      {formatDateLabel(pipelineRecebidasStats.best.date)} - {fmtNum(pipelineRecebidasStats.best.value)} recebidas
                    </li>
                  )}
                  {pipelineGanhasStats.best && (
                    <li>
                      <span className="text-text">Dia com mais ganhos:</span>{' '}
                      {formatDateLabel(pipelineGanhasStats.best.date)} - {fmtNum(pipelineGanhasStats.best.value)} ganhas
                    </li>
                  )}
                  {pipelineConversion ? (
                    <li>
                      <span className="text-text">Conversao do periodo:</span>{' '}
                      {formatPercentage(pipelineConversion)}
                    </li>
                  ) : (
                    <li>
                      <span className="text-text">Conversao do periodo:</span> sem dados suficientes
                    </li>
                  )}
                </ul>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
