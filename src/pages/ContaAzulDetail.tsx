
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { fetchDetailedData } from '../lib/api'
import { fmtMoney, fmtNum } from '../lib/format'

type NumericLike = number | string | null | undefined

interface ContaAzulRaw {
  ref_date: string
  recebiveisHojeQuant: NumericLike
  recebiveisHojeValor: NumericLike
  recebiveis7DiasQuant: NumericLike
  recebiveis7DiasValor: NumericLike
  pagaveisHojeQuant: NumericLike
  pagaveisHojeValor: NumericLike
  pagaveis7DiasQuant: NumericLike
  pagaveis7DiasValor: NumericLike
  entradasQuant: NumericLike
  entradaValor: NumericLike
  saidaQuant: NumericLike
  saidaValor: NumericLike
  fluxoCaixa: NumericLike
  topClient: string | null
  topClientValor: NumericLike
  topFornecedor: string | null
  topFornecedorValor: NumericLike
  esperadaQuant: NumericLike
  esperadaValor: NumericLike
  inadimplentesQuant: NumericLike
  inadimplentesValor: NumericLike
  updated_at?: string
}

interface ContaAzulRecord {
  ref_date: string
  updated_at: string
  recebiveisHojeQuant: number
  recebiveisHojeValor: number
  recebiveis7DiasQuant: number
  recebiveis7DiasValor: number
  pagaveisHojeQuant: number
  pagaveisHojeValor: number
  pagaveis7DiasQuant: number
  pagaveis7DiasValor: number
  entradasQuant: number
  entradaValor: number
  saidaQuant: number
  saidaValor: number
  fluxoCaixa: number
  topClient: string
  topClientValor: number
  topFornecedor: string
  topFornecedorValor: number
  esperadaQuant: number
  esperadaValor: number
  inadimplentesQuant: number
  inadimplentesValor: number
}

const toNumber = (value: NumericLike): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/\s/g, '').replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const normalizeRecord = (record: ContaAzulRaw): ContaAzulRecord => ({
  ref_date: record.ref_date,
  updated_at: record.updated_at ?? '',
  recebiveisHojeQuant: toNumber(record.recebiveisHojeQuant),
  recebiveisHojeValor: toNumber(record.recebiveisHojeValor),
  recebiveis7DiasQuant: toNumber(record.recebiveis7DiasQuant),
  recebiveis7DiasValor: toNumber(record.recebiveis7DiasValor),
  pagaveisHojeQuant: toNumber(record.pagaveisHojeQuant),
  pagaveisHojeValor: toNumber(record.pagaveisHojeValor),
  pagaveis7DiasQuant: toNumber(record.pagaveis7DiasQuant),
  pagaveis7DiasValor: toNumber(record.pagaveis7DiasValor),
  entradasQuant: toNumber(record.entradasQuant),
  entradaValor: toNumber(record.entradaValor),
  saidaQuant: toNumber(record.saidaQuant),
  saidaValor: toNumber(record.saidaValor),
  fluxoCaixa: toNumber(record.fluxoCaixa),
  topClient: record.topClient ?? 'Sem registro',
  topClientValor: toNumber(record.topClientValor),
  topFornecedor: record.topFornecedor ?? 'Sem registro',
  topFornecedorValor: toNumber(record.topFornecedorValor),
  esperadaQuant: toNumber(record.esperadaQuant),
  esperadaValor: toNumber(record.esperadaValor),
  inadimplentesQuant: toNumber(record.inadimplentesQuant),
  inadimplentesValor: toNumber(record.inadimplentesValor)
})

const formatDateLabel = (value: string) => {
  const date = new Date(value + 'T00:00:00')
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR')
}

const formatDay = (value: string) => {
  const date = new Date(value + 'T00:00:00')
  return Number.isNaN(date.getTime()) ? value : date.getDate().toString().padStart(2, '0')
}

const percentLabel = (value: number) => {
  if (!Number.isFinite(value)) return '-'
  return value.toFixed(1) + '%'
}

export default function ContaAzulDetail() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['conta-azul-detail'],
    queryFn: () => fetchDetailedData('conta_azul'),
    refetchInterval: 2 * 60 * 1000
  })

  const records = useMemo(() => {
    if (!Array.isArray(data)) return [] as ContaAzulRecord[]
    return (data as ContaAzulRaw[])
      .filter(item => !!item.ref_date)
      .map(normalizeRecord)
      .sort((a, b) => new Date(b.ref_date).getTime() - new Date(a.ref_date).getTime())
  }, [data])

  const latest = records[0]
  const mostRecentDateLabel = latest ? formatDateLabel(latest.ref_date) : '-'
  const lastUpdatedLabel = latest?.updated_at
    ? new Date(latest.updated_at).toLocaleString('pt-BR')
    : '-'

  const execucaoPercent = useMemo(() => {
    if (!latest) return 0
    const esperado = latest.esperadaValor
    return esperado > 0 ? (latest.entradaValor / esperado) * 100 : 0
  }, [latest])

  const saldoProjetado = latest
    ? latest.recebiveis7DiasValor - latest.pagaveis7DiasValor + latest.fluxoCaixa
    : 0

  const fluxoSeries = useMemo(() => {
    return [...records]
      .slice()
      .reverse()
      .map(item => ({
        date: item.ref_date,
        entradas: item.entradaValor,
        saidas: item.saidaValor,
        fluxo: item.fluxoCaixa
      }))
      .slice(-30)
  }, [records])

  const projecaoSeries = useMemo(() => {
    return [...records]
      .slice()
      .reverse()
      .map(item => ({
        date: item.ref_date,
        recebiveis: item.recebiveis7DiasValor,
        pagaveis: item.pagaveis7DiasValor,
        saldo: item.recebiveis7DiasValor - item.pagaveis7DiasValor
      }))
      .slice(-30)
  }, [records])

  const inadimplenciaSeries = useMemo(() => {
    return [...records]
      .slice()
      .reverse()
      .map(item => ({
        date: item.ref_date,
        quantidade: item.inadimplentesQuant,
        valor: item.inadimplentesValor
      }))
      .slice(-30)
  }, [records])

  const filteredRows = useMemo(() => {
    if (!searchTerm) return records.slice(0, 30)
    const term = searchTerm.toLowerCase()
    return records.filter(item => {
      const dateMatch = formatDateLabel(item.ref_date).toLowerCase().includes(term)
      const clientMatch = item.topClient.toLowerCase().includes(term)
      const fornecedorMatch = item.topFornecedor.toLowerCase().includes(term)
      return dateMatch || clientMatch || fornecedorMatch
    })
  }, [records, searchTerm])

  if (isLoading) {
    return (
      <div className='min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text'>
        <div className='mb-6 space-y-3'>
          <motion.div className='h-8 bg-bg2 rounded-lg' animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 1.4 }} />
          <motion.div className='h-4 bg-bg2 rounded-lg w-1/3' animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }} />
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6'>
          {[...Array(8)].map((_, index) => (
            <motion.div key={index} className='card h-24 bg-bg2/60' animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 1.6, delay: index * 0.05 }} />
          ))}
        </div>
        <motion.div className='card h-72 bg-bg2/60' animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0.4 }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text text-center pt-24 text-neonPink'>
        Erro ao carregar dados da Conta Azul.
      </div>
    )
  }

  if (!records.length) {
    return (
      <div className='min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text'>
        <motion.div className='card text-center py-16' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          Nenhum dado disponivel para Conta Azul no momento.
        </motion.div>
      </div>
    )
  }

  return (
    <div className='min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text'>
      <motion.div className='mb-6' initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <motion.h1 className='text-2xl sm:text-3xl font-bold text-text mb-2 flex flex-wrap items-center gap-3' initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          Conta Azul - Visao Executiva
        </motion.h1>
        <motion.div className='flex flex-wrap items-center gap-4 text-text2' initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <span>Dados consolidados em {mostRecentDateLabel}</span>
          <span className='text-xs bg-bg2/60 text-text px-2 py-1 rounded-md'>
            Ultima sincronizacao: {lastUpdatedLabel}
          </span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
          <Link to='/' className='text-blue-400 hover:underline mt-3 inline-flex items-center gap-2 group'>
            <motion.span whileHover={{ x: -4 }} transition={{ type: 'spring', stiffness: 320 }}>
              Voltar ao dashboard principal
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>

      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6'>
        <motion.div className='card' initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className='text-text2 text-xs uppercase tracking-wide mb-2'>Recebiveis do dia</p>
          <p className='text-lg sm:text-xl font-semibold'>{fmtMoney(latest.recebiveisHojeValor)}</p>
          <p className='text-xs text-text2'>{fmtNum(latest.recebiveisHojeQuant)} titulos programados</p>
        </motion.div>

        <motion.div className='card' initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className='text-text2 text-xs uppercase tracking-wide mb-2'>Entradas realizadas</p>
          <p className='text-lg sm:text-xl font-semibold text-emerald-300'>{fmtMoney(latest.entradaValor)}</p>
          <p className='text-xs text-text2'>{fmtNum(latest.entradasQuant)} liquidacoes confirmadas</p>
        </motion.div>

        <motion.div className='card' initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className='text-text2 text-xs uppercase tracking-wide mb-2'>Execucao do plano</p>
          <p className='text-lg sm:text-xl font-semibold text-cyan-300'>{percentLabel(execucaoPercent)}</p>
          <p className='text-xs text-text2'>Expectativa diaria: {fmtMoney(latest.esperadaValor)}</p>
        </motion.div>

        <motion.div className='card' initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className='text-text2 text-xs uppercase tracking-wide mb-2'>Fluxo de caixa do dia</p>
          <p className={`text-lg sm:text-xl font-semibold ${latest.fluxoCaixa >= 0 ? 'text-emerald-300' : 'text-neonPink'}`}>
            {fmtMoney(latest.fluxoCaixa)}
          </p>
          <p className='text-xs text-text2'>Entradas menos saidas</p>
        </motion.div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6'>
        <motion.div className='card' initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className='text-text2 text-xs uppercase tracking-wide mb-2'>Pagaveis do dia</p>
          <p className='text-lg sm:text-xl font-semibold text-orange-300'>{fmtMoney(latest.pagaveisHojeValor)}</p>
          <p className='text-xs text-text2'>{fmtNum(latest.pagaveisHojeQuant)} obrigacoes previstas</p>
        </motion.div>

        <motion.div className='card' initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className='text-text2 text-xs uppercase tracking-wide mb-2'>Saidas realizadas</p>
          <p className='text-lg sm:text-xl font-semibold text-red-300'>{fmtMoney(latest.saidaValor)}</p>
          <p className='text-xs text-text2'>{fmtNum(latest.saidaQuant)} pagamentos concluidos</p>
        </motion.div>

        <motion.div className='card' initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className='text-text2 text-xs uppercase tracking-wide mb-2'>Saldo projetado (7 dias)</p>
          <p className={`text-lg sm:text-xl font-semibold ${saldoProjetado >= 0 ? 'text-emerald-300' : 'text-neonPink'}`}>
            {fmtMoney(saldoProjetado)}
          </p>
          <p className='text-xs text-text2'>Recebiveis menos pagaveis futuros</p>
        </motion.div>

        <motion.div className='card' initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className='text-text2 text-xs uppercase tracking-wide mb-2'>Risco de inadimplencia</p>
          <p className={`text-lg sm:text-xl font-semibold ${latest.inadimplentesValor > 0 ? 'text-neonPink' : 'text-text'}`}>
            {fmtMoney(latest.inadimplentesValor)}
          </p>
          <p className='text-xs text-text2'>{fmtNum(latest.inadimplentesQuant)} titulos em aberto</p>
        </motion.div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6'>
        <motion.div className='card lg:col-span-2' initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} whileHover={{ y: -2 }}>
          <div className='flex flex-wrap items-center justify-between gap-2 mb-4'>
            <h3 className='card-title'>Fluxo diario: entradas x saidas</h3>
            <span className='text-xs text-text2'>Ultimos 30 dias</span>
          </div>
          <div className='h-72'>
            {fluxoSeries.length ? (
              <ResponsiveContainer width='100%' height='100%'>
                <ComposedChart data={fluxoSeries}>
                  <CartesianGrid strokeDasharray='3 3' opacity={0.15} />
                  <XAxis dataKey='date' tickFormatter={formatDay} fontSize={10} />
                  <YAxis yAxisId='left' fontSize={10} tickFormatter={value => fmtMoney(value as number)} width={90} />
                  <YAxis yAxisId='right' orientation='right' hide />
                  <Tooltip
                    labelFormatter={formatDateLabel}
                    formatter={(value, name) => {
                      const label = name.charAt(0).toUpperCase() + name.slice(1)
                      return [fmtMoney(value as number), label]
                    }}
                  />
                  <Legend formatter={value => value.charAt(0).toUpperCase() + value.slice(1)} />
                  <Area yAxisId='left' type='monotone' dataKey='entradas' stroke='#10b981' fill='#10b981' fillOpacity={0.15} strokeWidth={2} />
                  <Area yAxisId='left' type='monotone' dataKey='saidas' stroke='#f97316' fill='#f97316' fillOpacity={0.12} strokeWidth={2} />
                  <Line yAxisId='left' type='monotone' dataKey='fluxo' stroke='#38bdf8' strokeWidth={3} dot={{ r: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-full flex items-center justify-center text-text2 text-sm'>
                Sem historico suficiente.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div className='card' initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} whileHover={{ y: -2 }}>
          <h3 className='card-title mb-4'>Pontos de atencao do dia</h3>
          <div className='space-y-4'>
            <div>
              <p className='text-xs text-text2 uppercase tracking-wide mb-1'>Cliente destaque</p>
              <p className='text-sm font-semibold text-text'>{latest.topClient}</p>
              <p className='text-xs text-emerald-300'>{fmtMoney(latest.topClientValor)}</p>
            </div>
            <div className='border-t border-bg2 pt-4'>
              <p className='text-xs text-text2 uppercase tracking-wide mb-1'>Fornecedor critico</p>
              <p className='text-sm font-semibold text-text'>{latest.topFornecedor}</p>
              <p className='text-xs text-neonPink'>{fmtMoney(latest.topFornecedorValor)}</p>
            </div>
            <div className='border-t border-bg2 pt-4'>
              <p className='text-xs text-text2 uppercase tracking-wide mb-1'>Janela de 7 dias</p>
              <p className='text-sm text-text'>Recebiveis: {fmtMoney(latest.recebiveis7DiasValor)}</p>
              <p className='text-xs text-text2'>Pagaveis: {fmtMoney(latest.pagaveis7DiasValor)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6'>
        <motion.div className='card' initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} whileHover={{ y: -2 }}>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='card-title text-sm sm:text-lg'>Projecao de caixa - proximos 7 dias</h3>
            <span className='text-xs text-text2'>Ultimas capturas</span>
          </div>
          <div className='h-64'>
            {projecaoSeries.length ? (
              <ResponsiveContainer width='100%' height='100%'>
                <ComposedChart data={projecaoSeries}>
                  <CartesianGrid strokeDasharray='3 3' opacity={0.15} />
                  <XAxis dataKey='date' tickFormatter={formatDay} fontSize={10} />
                  <YAxis fontSize={10} tickFormatter={value => fmtMoney(value as number)} width={90} />
                  <Tooltip
                    labelFormatter={formatDateLabel}
                    formatter={(value, name) => {
                      if (name === 'saldo') return [fmtMoney(value as number), 'Saldo projetado']
                      return [fmtMoney(value as number), name === 'recebiveis' ? 'Recebiveis' : 'Pagaveis']
                    }}
                  />
                  <Legend formatter={value => { if (value === 'saldo') return 'Saldo projetado'; return value === 'recebiveis' ? 'Recebiveis' : 'Pagaveis'; }} />
                  <Bar dataKey='recebiveis' stackId='stack' fill='#22d3ee' radius={[4, 4, 0, 0]} name='Recebiveis' />
                  <Bar dataKey='pagaveis' stackId='stack' fill='#f97316' radius={[4, 4, 0, 0]} name='Pagaveis' />
                  <Line type='monotone' dataKey='saldo' stroke='#38bdf8' strokeWidth={3} dot={{ r: 2 }} name='Saldo projetado' />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-full flex items-center justify-center text-text2 text-sm'>
                Sem projecoes registradas.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div className='card' initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} whileHover={{ y: -2 }}>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='card-title text-sm sm:text-lg'>Inadimplencia monitorada</h3>
            <span className='text-xs text-text2'>Ultimos 30 dias</span>
          </div>
          <div className='h-64'>
            {inadimplenciaSeries.length ? (
              <ResponsiveContainer width='100%' height='100%'>
                <ComposedChart data={inadimplenciaSeries}>
                  <CartesianGrid strokeDasharray='3 3' opacity={0.15} />
                  <XAxis dataKey='date' tickFormatter={formatDay} fontSize={10} />
                  <YAxis yAxisId='left' fontSize={10} tickFormatter={value => fmtMoney(value as number)} width={90} />
                  <YAxis yAxisId='right' orientation='right' fontSize={10} tickFormatter={value => fmtNum(value as number)} />
                  <Tooltip
                    labelFormatter={formatDateLabel}
                    formatter={(value, name) => {
                      if (name === 'valor') return [fmtMoney(value as number), 'Valor em aberto']
                      return [fmtNum(value as number), 'Titulos']
                    }}
                  />
                  <Legend formatter={value => value === 'valor' ? 'Valor em aberto' : 'Quantidade'} />
                  <Bar yAxisId='right' dataKey='quantidade' fill='#818cf8' radius={[4, 4, 0, 0]} name='Quantidade'>
                    <LabelList dataKey='quantidade' position='top' formatter={(value: number) => fmtNum(value)} style={{ fill: '#ffffff', fontSize: 10 }} />
                  </Bar>
                  <Line yAxisId='left' type='monotone' dataKey='valor' stroke='#f43f5e' strokeWidth={3} dot={{ r: 2 }} name='Valor' />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-full flex items-center justify-center text-text2 text-sm'>
                Sem inadimplencia registrada.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div className='card' initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} whileHover={{ y: -2 }}>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4'>
          <h3 className='card-title'>Linha do tempo financeira</h3>
          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <input
              type='text'
              placeholder='Buscar por data, cliente ou fornecedor...'
              className='w-full sm:w-72 bg-bg2/40 border border-bg2/60 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60'
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-xs sm:text-sm'>
            <thead>
              <tr className='border-b border-bg2'>
                <th className='text-left p-2'>Data</th>
                <th className='text-right p-2'>Recebiveis hoje</th>
                <th className='text-right p-2'>Pagaveis hoje</th>
                <th className='text-right p-2'>Entradas</th>
                <th className='text-right p-2'>Saidas</th>
                <th className='text-right p-2'>Fluxo</th>
                <th className='text-right p-2'>Saldo 7 dias</th>
                <th className='text-right p-2'>Inadimplencia</th>
                <th className='text-left p-2'>Cliente destaque</th>
                <th className='text-left p-2'>Fornecedor destaque</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length ? (
                filteredRows.slice(0, 30).map((row, idx) => (
                  <motion.tr
                    key={`${row.ref_date}-${idx}`}
                    className='border-b border-bg2/40 hover:bg-bg2/20'
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.02 }}
                  >
                    <td className='p-2 whitespace-nowrap'>{formatDateLabel(row.ref_date)}</td>
                    <td className='p-2 text-right'>{fmtMoney(row.recebiveisHojeValor)}</td>
                    <td className='p-2 text-right'>{fmtMoney(row.pagaveisHojeValor)}</td>
                    <td className='p-2 text-right text-emerald-300'>{fmtMoney(row.entradaValor)}</td>
                    <td className='p-2 text-right text-red-300'>{fmtMoney(row.saidaValor)}</td>
                    <td className={`p-2 text-right ${row.fluxoCaixa >= 0 ? 'text-emerald-300' : 'text-neonPink'}`}>{fmtMoney(row.fluxoCaixa)}</td>
                    <td className={`p-2 text-right ${row.recebiveis7DiasValor - row.pagaveis7DiasValor >= 0 ? 'text-emerald-300' : 'text-neonPink'}`}>
                      {fmtMoney(row.recebiveis7DiasValor - row.pagaveis7DiasValor)}
                    </td>
                    <td className='p-2 text-right'>{fmtMoney(row.inadimplentesValor)}</td>
                    <td className='p-2 truncate max-w-[180px]' title={row.topClient}>{row.topClient}</td>
                    <td className='p-2 truncate max-w-[180px]' title={row.topFornecedor}>{row.topFornecedor}</td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className='text-center text-text2 p-4'>
                    Nenhum registro encontrado para o filtro informado.
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
