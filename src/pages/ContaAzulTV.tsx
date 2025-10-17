import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Area,
  Bar,
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

const PROJECAO_LEGEND_LABELS: Record<string, string> = {
  recebiveis: 'Recebiveis',
  pagaveis: 'Pagaveis',
  saldo: 'Saldo projetado'
}

const INADIMPLENCIA_LEGEND_LABELS: Record<string, string> = {
  valor: 'Valor em aberto',
  quantidade: 'Quantidade'
}

const SLIDE_DURATION_MS = 30_000

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

const buildHeaderGradient = () =>
  'radial-gradient(circle at top left, rgba(0, 168, 224, 0.25), transparent 55%), radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.2), transparent 45%)'

export default function ContaAzulTV() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [clock, setClock] = useState(() => new Date())

  const { data, isLoading, error } = useQuery({
    queryKey: ['conta-azul-tv'],
    queryFn: () => fetchDetailedData('conta_azul'),
    refetchInterval: 2 * 60 * 1000
  })

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1_000)
    return () => clearInterval(timer)
  }, [])

  const records = useMemo(() => {
    if (!Array.isArray(data)) return [] as ContaAzulRecord[]
    return (data as ContaAzulRaw[])
      .filter(item => !!item.ref_date)
      .map(normalizeRecord)
      .sort((a, b) => new Date(b.ref_date).getTime() - new Date(a.ref_date).getTime())
  }, [data])

  const latest = records[0]
  const slideCount = 4

  useEffect(() => {
    if (!records.length) return
    setCurrentSlide(0)
  }, [records.length])

  useEffect(() => {
    if (!records.length) return
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slideCount)
    }, SLIDE_DURATION_MS)

    return () => clearInterval(interval)
  }, [records.length, slideCount])

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

  const timelineRows = useMemo(() => records.slice(0, 12), [records])

  const summaryCards = useMemo(() => {
    if (!latest) return []
    return [
      {
        title: 'Recebiveis do dia',
        value: fmtMoney(latest.recebiveisHojeValor),
        subtitle: `${fmtNum(latest.recebiveisHojeQuant)} titulos programados`,
        accent: 'text-text'
      },
      {
        title: 'Entradas realizadas',
        value: fmtMoney(latest.entradaValor),
        subtitle: `${fmtNum(latest.entradasQuant)} liquidacoes confirmadas`,
        accent: 'text-emerald-300'
      },
      {
        title: 'Execucao do plano',
        value: percentLabel(execucaoPercent),
        subtitle: `Expectativa diaria: ${fmtMoney(latest.esperadaValor)}`,
        accent: 'text-cyan-300'
      },
      {
        title: 'Fluxo de caixa do dia',
        value: fmtMoney(latest.fluxoCaixa),
        subtitle: 'Entradas menos saidas',
        accent: latest.fluxoCaixa >= 0 ? 'text-emerald-300' : 'text-neonPink'
      },
      {
        title: 'Pagaveis do dia',
        value: fmtMoney(latest.pagaveisHojeValor),
        subtitle: `${fmtNum(latest.pagaveisHojeQuant)} obrigacoes previstas`,
        accent: 'text-orange-300'
      },
      {
        title: 'Saidas realizadas',
        value: fmtMoney(latest.saidaValor),
        subtitle: `${fmtNum(latest.saidaQuant)} pagamentos concluidos`,
        accent: 'text-red-300'
      },
      {
        title: 'Saldo projetado (7 dias)',
        value: fmtMoney(saldoProjetado),
        subtitle: 'Recebiveis menos pagaveis futuros',
        accent: saldoProjetado >= 0 ? 'text-emerald-300' : 'text-neonPink'
      },
      {
        title: 'Risco de inadimplencia',
        value: fmtMoney(latest.inadimplentesValor),
        subtitle: `${fmtNum(latest.inadimplentesQuant)} titulos em aberto`,
        accent: latest.inadimplentesValor > 0 ? 'text-neonPink' : 'text-text'
      }
    ]
  }, [execucaoPercent, latest, saldoProjetado])

  if (isLoading) {
    return (
      <div className='min-h-screen w-full flex items-center justify-center bg-bg text-text'>
        Carregando consolidado Conta Azul...
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen w-full flex items-center justify-center bg-bg text-neonPink text-2xl font-semibold'>
        Erro ao carregar dados da Conta Azul.
      </div>
    )
  }

  if (!records.length || !latest) {
    return (
      <div className='min-h-screen w-full flex items-center justify-center bg-bg text-text'>
        Nenhum dado disponivel para Conta Azul no momento.
      </div>
    )
  }

  const slides = [
    {
      key: 'overview',
      node: (
        <div className='grid grid-cols-4 grid-rows-2 gap-6 h-full'>
          {summaryCards.map(card => (
            <div
              key={card.title}
              className='rounded-3xl bg-white/10 border border-white/10 p-8 flex flex-col justify-between shadow-lg shadow-black/40'
            >
              <span className='uppercase tracking-[0.3em] text-sm text-text2/80 font-semibold'>
                {card.title}
              </span>
              <span className={`text-5xl font-semibold leading-tight mt-6 ${card.accent}`}>
                {card.value}
              </span>
              <span className='text-lg text-text2/80 mt-4'>{card.subtitle}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'fluxo',
      node: (
        <div className='grid grid-cols-[2fr_1fr] gap-6 h-full'>
          <div className='rounded-3xl bg-white/10 border border-white/10 p-8 flex flex-col shadow-lg shadow-black/40'>
            <div className='flex items-start justify-between mb-6'>
              <div>
                <h2 className='text-4xl font-semibold tracking-tight'>Fluxo diario</h2>
                <p className='text-lg text-text2/80'>Entradas x saidas | ultimos 30 dias</p>
              </div>
              <span className='text-sm text-text2/70 uppercase tracking-[0.35em]'>
                Atualizado {mostRecentDateLabel}
              </span>
            </div>
            <div className='flex-1 min-h-[420px]'>
              {fluxoSeries.length ? (
                <ResponsiveContainer width='100%' height='100%'>
                  <ComposedChart data={fluxoSeries}>
                    <CartesianGrid strokeDasharray='3 3' opacity={0.2} />
                    <XAxis dataKey='date' tickFormatter={formatDay} stroke='rgba(255,255,255,0.4)' fontSize={14} />
                    <YAxis
                      yAxisId='left'
                      tickFormatter={value => fmtMoney(value as number)}
                      stroke='rgba(255,255,255,0.4)'
                      fontSize={14}
                      width={120}
                    />
                    <YAxis yAxisId='right' orientation='right' hide />
                    <Tooltip
                      labelFormatter={formatDateLabel}
                      formatter={(value, name) => {
                        const label = name.charAt(0).toUpperCase() + name.slice(1)
                        return [fmtMoney(value as number), label]
                      }}
                    />
                    <Legend formatter={value => value.charAt(0).toUpperCase() + value.slice(1)} />
                    <Area
                      yAxisId='left'
                      type='monotone'
                      dataKey='entradas'
                      stroke='#10b981'
                      fill='#10b981'
                      fillOpacity={0.22}
                      strokeWidth={3}
                    />
                    <Area
                      yAxisId='left'
                      type='monotone'
                      dataKey='saidas'
                      stroke='#f97316'
                      fill='#f97316'
                      fillOpacity={0.18}
                      strokeWidth={3}
                    />
                    <Line yAxisId='left' type='monotone' dataKey='fluxo' stroke='#38bdf8' strokeWidth={4} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className='h-full flex items-center justify-center text-xl text-text2'>
                  Sem historico suficiente.
                </div>
              )}
            </div>
          </div>
          <div className='flex flex-col gap-6'>
            <div className='rounded-3xl bg-white/10 border border-white/10 p-8 shadow-lg shadow-black/40'>
              <h3 className='text-3xl font-semibold mb-6'>Alertas rapidos</h3>
              <div className='space-y-6 text-lg'>
                <div>
                  <p className='text-sm uppercase tracking-[0.25em] text-text2/80'>Cliente destaque</p>
                  <p className='text-2xl font-semibold text-text mt-2'>{latest.topClient}</p>
                  <p className='text-lg text-emerald-300 mt-1'>{fmtMoney(latest.topClientValor)}</p>
                </div>
                <div className='border-t border-white/10 pt-6'>
                  <p className='text-sm uppercase tracking-[0.25em] text-text2/80'>Fornecedor critico</p>
                  <p className='text-2xl font-semibold text-text mt-2'>{latest.topFornecedor}</p>
                  <p className='text-lg text-neonPink mt-1'>{fmtMoney(latest.topFornecedorValor)}</p>
                </div>
              </div>
            </div>
            <div className='rounded-3xl bg-white/10 border border-white/10 p-8 shadow-lg shadow-black/40 flex flex-col gap-4'>
              <h3 className='text-3xl font-semibold'>Janela de 7 dias</h3>
              <div className='flex flex-col gap-3 text-lg'>
                <p className='flex items-center justify-between'>
                  <span className='text-text2/80 uppercase tracking-[0.3em] text-sm'>Recebiveis</span>
                  <span className='text-2xl font-semibold text-emerald-300'>{fmtMoney(latest.recebiveis7DiasValor)}</span>
                </p>
                <p className='flex items-center justify-between'>
                  <span className='text-text2/80 uppercase tracking-[0.3em] text-sm'>Pagaveis</span>
                  <span className='text-2xl font-semibold text-neonPink'>{fmtMoney(latest.pagaveis7DiasValor)}</span>
                </p>
                <p className='flex items-center justify-between border-t border-white/10 pt-4 mt-2'>
                  <span className='text-text2/80 uppercase tracking-[0.3em] text-sm'>Saldo projetado</span>
                  <span
                    className={`text-3xl font-bold ${
                      saldoProjetado >= 0 ? 'text-emerald-300' : 'text-neonPink'
                    }`}
                  >
                    {fmtMoney(saldoProjetado)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'projecao',
      node: (
        <div className='grid grid-cols-2 gap-6 h-full'>
          <div className='rounded-3xl bg-white/10 border border-white/10 p-8 flex flex-col shadow-lg shadow-black/40'>
            <div className='flex items-start justify-between mb-6'>
              <div>
                <h2 className='text-4xl font-semibold tracking-tight'>Projecoes de caixa</h2>
                <p className='text-lg text-text2/80'>Ultimas capturas | 7 dias</p>
              </div>
              <span className='text-sm text-text2/70 uppercase tracking-[0.35em]'>
                Base {mostRecentDateLabel}
              </span>
            </div>
            <div className='flex-1 min-h-[420px]'>
              {projecaoSeries.length ? (
                <ResponsiveContainer width='100%' height='100%'>
                  <ComposedChart data={projecaoSeries}>
                    <CartesianGrid strokeDasharray='3 3' opacity={0.2} />
                    <XAxis dataKey='date' tickFormatter={formatDay} stroke='rgba(255,255,255,0.4)' fontSize={14} />
                    <YAxis
                      tickFormatter={value => fmtMoney(value as number)}
                      stroke='rgba(255,255,255,0.4)'
                      fontSize={14}
                      width={140}
                    />
                    <Tooltip
                      labelFormatter={formatDateLabel}
                      formatter={(value, _name, item) => {
                        const key = (item?.dataKey as string) || ''
                        if (key === 'saldo') return [fmtMoney(value as number), PROJECAO_LEGEND_LABELS.saldo]
                        if (key === 'recebiveis') return [fmtMoney(value as number), PROJECAO_LEGEND_LABELS.recebiveis]
                        if (key === 'pagaveis') return [fmtMoney(value as number), PROJECAO_LEGEND_LABELS.pagaveis]
                        return [fmtMoney(value as number), key]
                      }}
                    />
                    <Legend
                      formatter={(value, entry: any) => {
                        const key = (entry?.dataKey as string) || value
                        return PROJECAO_LEGEND_LABELS[key] ?? entry?.payload?.name ?? value
                      }}
                    />
                    <Bar dataKey='recebiveis' stackId='stack' fill='#22d3ee' radius={[8, 8, 0, 0]} name='Recebiveis' />
                    <Bar dataKey='pagaveis' stackId='stack' fill='#f97316' radius={[8, 8, 0, 0]} name='Pagaveis' />
                    <Line type='monotone' dataKey='saldo' stroke='#38bdf8' strokeWidth={4} dot={{ r: 3 }} name='Saldo projetado' />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className='h-full flex items-center justify-center text-xl text-text2'>
                  Sem projecoes registradas.
                </div>
              )}
            </div>
          </div>
          <div className='rounded-3xl bg-white/10 border border-white/10 p-8 flex flex-col shadow-lg shadow-black/40'>
            <div className='flex items-start justify-between mb-6'>
              <div>
                <h2 className='text-4xl font-semibold tracking-tight'>Inadimplencia monitorada</h2>
                <p className='text-lg text-text2/80'>Ultimos 30 dias</p>
              </div>
            </div>
            <div className='flex-1 min-h-[420px]'>
              {inadimplenciaSeries.length ? (
                <ResponsiveContainer width='100%' height='100%'>
                  <ComposedChart data={inadimplenciaSeries}>
                    <CartesianGrid strokeDasharray='3 3' opacity={0.2} />
                    <XAxis dataKey='date' tickFormatter={formatDay} stroke='rgba(255,255,255,0.4)' fontSize={14} />
                    <YAxis
                      yAxisId='left'
                      tickFormatter={value => fmtMoney(value as number)}
                      stroke='rgba(255,255,255,0.4)'
                      fontSize={14}
                      width={140}
                    />
                    <YAxis
                      yAxisId='right'
                      orientation='right'
                      tickFormatter={value => fmtNum(value as number)}
                      stroke='rgba(255,255,255,0.4)'
                      fontSize={14}
                    />
                    <Tooltip
                      labelFormatter={formatDateLabel}
                      formatter={(value, name) => {
                        if (name === 'valor') return [fmtMoney(value as number), 'Valor em aberto']
                        return [fmtNum(value as number), 'Titulos']
                      }}
                    />
                    <Legend
                      formatter={(value, entry: any) => {
                        const key = (entry?.dataKey as string) || value
                        return INADIMPLENCIA_LEGEND_LABELS[key] ?? entry?.payload?.name ?? value
                      }}
                    />
                    <Bar yAxisId='right' dataKey='quantidade' fill='#818cf8' radius={[8, 8, 0, 0]} name='Quantidade'>
                      <LabelList
                        dataKey='quantidade'
                        position='top'
                        formatter={(value: number) => fmtNum(value)}
                        style={{ fill: '#ffffff', fontSize: 14, fontWeight: 600 }}
                      />
                    </Bar>
                    <Line yAxisId='left' type='monotone' dataKey='valor' stroke='#f43f5e' strokeWidth={4} dot={{ r: 3 }} name='Valor' />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className='h-full flex items-center justify-center text-xl text-text2'>
                  Sem inadimplencia registrada.
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'timeline',
      node: (
        <div className='rounded-3xl bg-white/10 border border-white/10 p-8 flex flex-col h-full shadow-lg shadow-black/40'>
          <div className='flex items-start justify-between mb-6'>
            <div>
              <h2 className='text-4xl font-semibold tracking-tight'>Linha do tempo financeira</h2>
              <p className='text-lg text-text2/80'>Principais movimentos recentes</p>
            </div>
            <span className='text-sm text-text2/70 uppercase tracking-[0.35em]'>
              Top {timelineRows.length} registros
            </span>
          </div>
          <div className='flex-1 overflow-hidden'>
            <table className='w-full table-fixed text-lg'>
              <thead className='text-text2/80 text-sm uppercase tracking-[0.25em]'>
                <tr>
                  <th className='text-left pb-4 pr-4'>Data</th>
                  <th className='text-right pb-4 pr-4'>Recebiveis</th>
                  <th className='text-right pb-4 pr-4'>Pagaveis</th>
                  <th className='text-right pb-4 pr-4'>Entradas</th>
                  <th className='text-right pb-4 pr-4'>Saidas</th>
                  <th className='text-right pb-4 pr-4'>Fluxo</th>
                  <th className='text-left pb-4 pr-4'>Cliente destaque</th>
                  <th className='text-left pb-4'>Fornecedor destaque</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-white/10'>
                {timelineRows.map((row, index) => (
                  <tr key={`${row.ref_date}-${index}`} className='h-16'>
                    <td className='pr-4'>{formatDateLabel(row.ref_date)}</td>
                    <td className='text-right pr-4'>{fmtMoney(row.recebiveisHojeValor)}</td>
                    <td className='text-right pr-4'>{fmtMoney(row.pagaveisHojeValor)}</td>
                    <td className='text-right pr-4 text-emerald-300'>{fmtMoney(row.entradaValor)}</td>
                    <td className='text-right pr-4 text-red-300'>{fmtMoney(row.saidaValor)}</td>
                    <td
                      className={`text-right pr-4 ${
                        row.fluxoCaixa >= 0 ? 'text-emerald-300' : 'text-neonPink'
                      }`}
                    >
                      {fmtMoney(row.fluxoCaixa)}
                    </td>
                    <td className='pr-4 truncate max-w-[240px]' title={row.topClient}>
                      {row.topClient}
                    </td>
                    <td className='truncate max-w-[240px]' title={row.topFornecedor}>
                      {row.topFornecedor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className='min-h-screen w-full flex items-center justify-center bg-bg text-text py-6'>
      <div
        className='relative w-[1920px] h-[1080px] rounded-[48px] border border-white/10 overflow-hidden shadow-[0_24px_120px_rgba(0,0,0,0.65)]'
        style={{ background: buildHeaderGradient() }}
      >
        <div className='absolute inset-0 bg-black/35 backdrop-blur-[4px]' />
        <div className='relative z-10 flex flex-col h-full px-10 py-10 gap-8'>
          <motion.div
            className='flex items-start justify-between'
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h1 className='text-5xl font-bold tracking-tight'>Conta Azul | Painel Financeiro TV</h1>
              <p className='text-2xl text-text2/80 mt-2'>Dados consolidados em {mostRecentDateLabel}</p>
              <p className='text-lg text-text2/60 mt-1'>Ultima sincronizacao: {lastUpdatedLabel}</p>
            </div>
            <div className='text-right'>
              <p className='text-5xl font-semibold text-neonAqua tracking-tight'>
                {clock.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className='text-lg text-text2/70 uppercase tracking-[0.35em] mt-3'>
                Slide {currentSlide + 1} / {slideCount}
              </p>
              <p className='text-sm text-text2/60 mt-2'>Rotacao automatica a cada 30 segundos</p>
            </div>
          </motion.div>

          <div className='flex-1 relative overflow-hidden'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={slides[currentSlide].key}
                className='absolute inset-0'
                initial={{ opacity: 0, x: 120 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -120 }}
                transition={{ duration: 0.6 }}
              >
                {slides[currentSlide].node}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-sm text-text2/70 uppercase tracking-[0.3em]'>
              Conta Azul | Grupo B&O
            </span>
            <div className='flex items-center gap-3'>
              {slides.map((slide, index) => (
                <span
                  key={slide.key}
                  className={`h-3 rounded-full transition-all duration-500 ${
                    currentSlide === index ? 'w-12 bg-neonAqua' : 'w-3 bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
