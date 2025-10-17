import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Area,
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
import { fetchDetailedData } from '../lib/api'
import { fmtMoney, fmtNum } from '../lib/format'

interface MetaAdsRecord {
  ref_date: string
  account_id: string
  account_name: string
  campaign_id: string
  campaign_name: string
  cost: number
  leads: number
  clicks: number
  impressions: number
  reach: number
  frequency: number
  updated_at: string
}

interface GoogleAdsRecord {
  ref_date: string
  account_id: string
  account_name: string
  campaign_name: string
  cost: number
  leads: number
  clicks: number
  impressions: number
  roas: number
  updated_at: string
}

interface DailyMetaPoint {
  date: string
  spend: number
  leads: number
  clicks: number
  impressions: number
  reach: number
  frequency: number
}

interface DailyGooglePoint {
  date: string
  spend: number
  leads: number
  clicks: number
  impressions: number
  roas: number
}

interface MetaCampaignRow {
  key: string
  campaign: string
  account: string
  spend: number
  leads: number
  clicks: number
  cpl: number
  conversion: number
}

interface GoogleCampaignRow {
  key: string
  campaign: string
  account: string
  spend: number
  leads: number
  clicks: number
  cpl: number
  roas: number
}

interface MetricCard {
  label: string
  value: string
  description?: string
  accent: string
}

const SLIDE_DURATION_MS = 30_000

const META_TREND_LABELS: Record<string, string> = {
  spend: 'Investimento',
  leads: 'Leads',
  cpl: 'CPL',
  cpc: 'CPC'
}

const META_REACH_LABELS: Record<string, string> = {
  reach: 'Alcance',
  impressions: 'Impressoes',
  frequency: 'Frequencia'
}

const GOOGLE_PERFORMANCE_LABELS: Record<string, string> = {
  spend: 'Investimento',
  leads: 'Leads',
  clicks: 'Cliques',
  conversion: 'Conversao'
}

const GOOGLE_EFFICIENCY_LABELS: Record<string, string> = {
  spend: 'Investimento',
  roas: 'ROAS',
  cpl: 'CPL',
  cpc: 'CPC'
}

const safeDivide = (numerator: number, denominator: number) => {
  if (!denominator) return 0
  return numerator / denominator
}

const percentLabel = (value: number) => {
  if (!Number.isFinite(value)) return '-'
  return `${value.toFixed(1)}%`
}

const formatDateLabel = (value: string) => {
  const date = new Date(value + 'T00:00:00')
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR')
}

const formatDay = (value: string) => {
  const date = new Date(value + 'T00:00:00')
  return Number.isNaN(date.getTime()) ? value : date.getDate().toString().padStart(2, '0')
}

const buildBackground = () =>
  'radial-gradient(circle at top left, rgba(0, 168, 224, 0.22), transparent 55%), radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.18), transparent 45%)'

const resolveLastUpdatedLabel = (records: { updated_at?: string }[]) => {
  const latestTimestamp = records.reduce((latest, record) => {
    const current = record.updated_at ? new Date(record.updated_at).getTime() : 0
    return current > latest ? current : latest
  }, 0)
  return latestTimestamp ? new Date(latestTimestamp).toLocaleString('pt-BR') : '-'
}

const formatFrequency = (value: number) => (Number.isFinite(value) ? value.toFixed(2) : '-')

export default function MarketingTV() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [clock, setClock] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1_000)
    return () => clearInterval(timer)
  }, [])

  const {
    data: metaData,
    isLoading: metaLoading,
    error: metaError
  } = useQuery({
    queryKey: ['meta-ads-tv'],
    queryFn: () => fetchDetailedData('meta_ads'),
    refetchInterval: 2 * 60 * 1000
  })

  const {
    data: googleData,
    isLoading: googleLoading,
    error: googleError
  } = useQuery({
    queryKey: ['google-ads-tv'],
    queryFn: () => fetchDetailedData('google_ads'),
    refetchInterval: 2 * 60 * 1000
  })

  const metaRecords = useMemo(() => {
    if (!Array.isArray(metaData)) return [] as MetaAdsRecord[]
    return (metaData as MetaAdsRecord[]).filter(item => !!item.ref_date)
  }, [metaData])

  const googleRecords = useMemo(() => {
    if (!Array.isArray(googleData)) return [] as GoogleAdsRecord[]
    return (googleData as GoogleAdsRecord[]).filter(item => !!item.ref_date)
  }, [googleData])

  const metaDailySeries = useMemo<DailyMetaPoint[]>(() => {
    const map = new Map<
      string,
      {
        date: string
        spend: number
        leads: number
        clicks: number
        impressions: number
        reach: number
        frequency: number
        items: number
      }
    >()

    metaRecords.forEach(record => {
      const date = record.ref_date
      if (!date) return

      const spend = record.cost || 0
      const leads = record.leads || 0
      const clicks = record.clicks || 0
      const impressions = record.impressions || 0
      const reach = record.reach || 0
      const frequency = record.frequency || 0

      const existing = map.get(date)
      if (existing) {
        existing.spend += spend
        existing.leads += leads
        existing.clicks += clicks
        existing.impressions += impressions
        existing.reach += reach
        existing.frequency += frequency
        existing.items += 1
      } else {
        map.set(date, {
          date,
          spend,
          leads,
          clicks,
          impressions,
          reach,
          frequency,
          items: 1
        })
      }
    })

    return Array.from(map.values())
      .map(entry => ({
        date: entry.date,
        spend: entry.spend,
        leads: entry.leads,
        clicks: entry.clicks,
        impressions: entry.impressions,
        reach: entry.reach,
        frequency: entry.items ? entry.frequency / entry.items : 0
      }))
      .sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime())
      .slice(-30)
  }, [metaRecords])

  const googleDailySeries = useMemo<DailyGooglePoint[]>(() => {
    const map = new Map<
      string,
      {
        date: string
        spend: number
        leads: number
        clicks: number
        impressions: number
        weightedRoas: number
        roasWeight: number
      }
    >()

    googleRecords.forEach(record => {
      const date = record.ref_date
      if (!date) return

      const spend = record.cost || 0
      const leads = record.leads || 0
      const clicks = record.clicks || 0
      const impressions = record.impressions || 0
      const roas = record.roas || 0

      const existing = map.get(date)
      if (existing) {
        existing.spend += spend
        existing.leads += leads
        existing.clicks += clicks
        existing.impressions += impressions
        existing.weightedRoas += roas * spend
        existing.roasWeight += spend
      } else {
        map.set(date, {
          date,
          spend,
          leads,
          clicks,
          impressions,
          weightedRoas: roas * spend,
          roasWeight: spend
        })
      }
    })

    return Array.from(map.values())
      .map(entry => ({
        date: entry.date,
        spend: entry.spend,
        leads: entry.leads,
        clicks: entry.clicks,
        impressions: entry.impressions,
        roas: entry.roasWeight ? entry.weightedRoas / entry.roasWeight : 0
      }))
      .sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime())
      .slice(-30)
  }, [googleRecords])

  const metaLatest = metaDailySeries[metaDailySeries.length - 1]
  const googleLatest = googleDailySeries[googleDailySeries.length - 1]

  const metaTrendSeries = useMemo(
    () =>
      metaDailySeries.map(day => ({
        date: day.date,
        spend: day.spend,
        leads: day.leads,
        cpl: safeDivide(day.spend, day.leads),
        cpc: safeDivide(day.spend, day.clicks)
      })),
    [metaDailySeries]
  )

  const metaReachSeries = useMemo(
    () =>
      metaDailySeries.map(day => ({
        date: day.date,
        reach: day.reach,
        impressions: day.impressions,
        frequency: day.frequency
      })),
    [metaDailySeries]
  )

  const googlePerformanceSeries = useMemo(
    () =>
      googleDailySeries.map(day => ({
        date: day.date,
        spend: day.spend,
        leads: day.leads,
        clicks: day.clicks,
        conversion: safeDivide(day.leads, day.clicks) * 100
      })),
    [googleDailySeries]
  )

  const googleEfficiencySeries = useMemo(
    () =>
      googleDailySeries.map(day => ({
        date: day.date,
        spend: day.spend,
        roas: day.roas,
        cpl: safeDivide(day.spend, day.leads),
        cpc: safeDivide(day.spend, day.clicks)
      })),
    [googleDailySeries]
  )

  const metaOverviewCards = useMemo<MetricCard[]>(() => {
    if (!metaLatest) return []
    return [
      {
        label: 'Investimento do dia',
        value: fmtMoney(metaLatest.spend),
        description: `Leads: ${fmtNum(metaLatest.leads)} | CPL: ${fmtMoney(safeDivide(metaLatest.spend, metaLatest.leads))}`,
        accent: 'text-blue-300'
      },
      {
        label: 'Leads confirmados',
        value: fmtNum(metaLatest.leads),
        description: `Cliques: ${fmtNum(metaLatest.clicks)}`,
        accent: 'text-emerald-300'
      },
      {
        label: 'Taxa de conversao',
        value: percentLabel(safeDivide(metaLatest.leads, metaLatest.clicks) * 100),
        description: `CPC: ${fmtMoney(safeDivide(metaLatest.spend, metaLatest.clicks))}`,
        accent: 'text-violet-300'
      },
      {
        label: 'Alcance e frequencia',
        value: fmtNum(metaLatest.reach),
        description: `Impressoes: ${fmtNum(metaLatest.impressions)} | Frequencia: ${formatFrequency(metaLatest.frequency)}`,
        accent: 'text-orange-300'
      }
    ]
  }, [metaLatest])

  const googleOverviewCards = useMemo<MetricCard[]>(() => {
    if (!googleLatest) return []
    const roasLabel = Number.isFinite(googleLatest.roas) ? `${googleLatest.roas.toFixed(2)}x` : '-'
    return [
      {
        label: 'Investimento do dia',
        value: fmtMoney(googleLatest.spend),
        description: `Leads: ${fmtNum(googleLatest.leads)} | CPL: ${fmtMoney(safeDivide(googleLatest.spend, googleLatest.leads))}`,
        accent: 'text-blue-300'
      },
      {
        label: 'ROAS medio',
        value: roasLabel,
        description: `Conversao: ${percentLabel(safeDivide(googleLatest.leads, googleLatest.clicks) * 100)}`,
        accent: 'text-emerald-300'
      },
      {
        label: 'Cliques gerados',
        value: fmtNum(googleLatest.clicks),
        description: `CPC: ${fmtMoney(safeDivide(googleLatest.spend, googleLatest.clicks))}`,
        accent: 'text-cyan-300'
      },
      {
        label: 'Impressoes totais',
        value: fmtNum(googleLatest.impressions),
        description: `Leads/impressoes: ${percentLabel(safeDivide(googleLatest.leads, googleLatest.impressions) * 100)}`,
        accent: 'text-orange-300'
      }
    ]
  }, [googleLatest])

  const metaCampaigns = useMemo<MetaCampaignRow[]>(() => {
    const map = new Map<string, MetaCampaignRow>()

    metaRecords.forEach(record => {
      const key = `${record.campaign_id ?? record.campaign_name ?? 'meta'}-${record.account_id ?? record.account_name ?? 'account'}`
      const campaign = record.campaign_name || 'Campanha sem nome'
      const account = record.account_name || 'Conta sem nome'
      const spend = record.cost || 0
      const leads = record.leads || 0
      const clicks = record.clicks || 0

      const existing = map.get(key)
      if (existing) {
        existing.spend += spend
        existing.leads += leads
        existing.clicks += clicks
      } else {
        map.set(key, {
          key,
          campaign,
          account,
          spend,
          leads,
          clicks,
          cpl: 0,
          conversion: 0
        })
      }
    })

    return Array.from(map.values())
      .map(item => ({
        ...item,
        cpl: safeDivide(item.spend, item.leads),
        conversion: safeDivide(item.leads, item.clicks) * 100
      }))
      .sort((a, b) => b.spend - a.spend)
  }, [metaRecords])

  const googleCampaigns = useMemo<GoogleCampaignRow[]>(() => {
    const map = new Map<
      string,
      {
        key: string
        campaign: string
        account: string
        spend: number
        leads: number
        clicks: number
        weightedRoas: number
        roasWeight: number
      }
    >()

    googleRecords.forEach(record => {
      const key = `${record.campaign_name ?? 'google'}-${record.account_id ?? record.account_name ?? 'account'}`
      const campaign = record.campaign_name || 'Campanha sem nome'
      const account = record.account_name || 'Conta sem nome'
      const spend = record.cost || 0
      const leads = record.leads || 0
      const clicks = record.clicks || 0
      const roas = record.roas || 0

      const existing = map.get(key)
      if (existing) {
        existing.spend += spend
        existing.leads += leads
        existing.clicks += clicks
        existing.weightedRoas += roas * spend
        existing.roasWeight += spend
      } else {
        map.set(key, {
          key,
          campaign,
          account,
          spend,
          leads,
          clicks,
          weightedRoas: roas * spend,
          roasWeight: spend
        })
      }
    })

    return Array.from(map.values())
      .map(item => ({
        key: item.key,
        campaign: item.campaign,
        account: item.account,
        spend: item.spend,
        leads: item.leads,
        clicks: item.clicks,
        cpl: safeDivide(item.spend, item.leads),
        roas: item.roasWeight ? item.weightedRoas / item.roasWeight : 0
      }))
      .sort((a, b) => b.spend - a.spend)
  }, [googleRecords])

  const metaTopThree = useMemo(() => metaCampaigns.slice(0, 3), [metaCampaigns])
  const googleTopThree = useMemo(() => googleCampaigns.slice(0, 3), [googleCampaigns])

  const metaMostRecentLabel = metaLatest ? formatDateLabel(metaLatest.date) : '-'
  const googleMostRecentLabel = googleLatest ? formatDateLabel(googleLatest.date) : '-'

  const metaLastUpdated = useMemo(() => resolveLastUpdatedLabel(metaRecords), [metaRecords])
  const googleLastUpdated = useMemo(() => resolveLastUpdatedLabel(googleRecords), [googleRecords])

  const slideCount = 6

  useEffect(() => {
    if (!metaRecords.length && !googleRecords.length) return
    setCurrentSlide(0)
  }, [metaRecords.length, googleRecords.length])

  useEffect(() => {
    if (!slideCount) return
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slideCount)
    }, SLIDE_DURATION_MS)
    return () => clearInterval(interval)
  }, [slideCount])

  if (metaLoading || googleLoading) {
    return (
      <div className='min-h-screen w-full flex items-center justify-center bg-bg text-text text-xl'>
        Carregando visao de marketing...
      </div>
    )
  }

  if (metaError || googleError) {
    return (
      <div className='min-h-screen w-full flex items-center justify-center bg-bg text-neonPink text-2xl font-semibold text-center px-6'>
        Erro ao carregar dados de marketing.
      </div>
    )
  }

  if (!metaRecords.length && !googleRecords.length) {
    return (
      <div className='min-h-screen w-full flex items-center justify-center bg-bg text-text text-xl'>
        Nenhum dado disponivel para Meta Ads ou Google Ads no momento.
      </div>
    )
  }

  const slides = [
    {
      key: 'overview',
      node: (
        <div className='grid grid-cols-2 gap-6 h-full'>
          <section className='rounded-3xl bg-white/10 border border-white/10 p-8 flex flex-col shadow-lg shadow-black/40'>
            <header className='flex items-start justify-between mb-6'>
              <div>
                <h2 className='text-3xl font-semibold tracking-tight'>Meta Ads</h2>
                <p className='text-base text-text2/80'>Base {metaMostRecentLabel}</p>
              </div>
              <span className='text-xs text-text2/60 uppercase tracking-[0.35em] max-w-[200px] text-right'>
                Ultima atualizacao {metaLastUpdated}
              </span>
            </header>
            {metaOverviewCards.length ? (
              <div className='grid grid-cols-2 gap-6 flex-1'>
                {metaOverviewCards.map(card => (
                  <div
                    key={card.label}
                    className='rounded-2xl bg-white/10 border border-white/10 p-6 flex flex-col justify-between shadow-inner shadow-black/20'
                  >
                    <span className='text-sm uppercase tracking-[0.3em] text-text2/70'>{card.label}</span>
                    <span className={`text-4xl font-semibold mt-4 ${card.accent}`}>{card.value}</span>
                    {card.description ? <span className='text-base text-text2/80 mt-3'>{card.description}</span> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex-1 flex items-center justify-center text-text2/70 text-2xl text-center'>Sem dados recentes.</div>
            )}
          </section>
          <section className='rounded-3xl bg-white/10 border border-white/10 p-8 flex flex-col shadow-lg shadow-black/40'>
            <header className='flex items-start justify-between mb-6'>
              <div>
                <h2 className='text-3xl font-semibold tracking-tight'>Google Ads</h2>
                <p className='text-base text-text2/80'>Base {googleMostRecentLabel}</p>
              </div>
              <span className='text-xs text-text2/60 uppercase tracking-[0.35em] max-w-[200px] text-right'>
                Ultima atualizacao {googleLastUpdated}
              </span>
            </header>
            {googleOverviewCards.length ? (
              <div className='grid grid-cols-2 gap-6 flex-1'>
                {googleOverviewCards.map(card => (
                  <div
                    key={card.label}
                    className='rounded-2xl bg-white/10 border border-white/10 p-6 flex flex-col justify-between shadow-inner shadow-black/20'
                  >
                    <span className='text-sm uppercase tracking-[0.3em] text-text2/70'>{card.label}</span>
                    <span className={`text-4xl font-semibold mt-4 ${card.accent}`}>{card.value}</span>
                    {card.description ? <span className='text-base text-text2/80 mt-3'>{card.description}</span> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex-1 flex items-center justify-center text-text2/70 text-2xl text-center'>Sem dados recentes.</div>
            )}
          </section>
        </div>
      )
    },
    {
      key: 'meta-trend',
      node: (
        <div className='rounded-3xl bg-white/10 border border-white/10 p-10 flex flex-col h-full shadow-lg shadow-black/40'>
          <header className='flex items-start justify-between mb-6'>
            <div>
              <h2 className='text-4xl font-semibold tracking-tight'>Meta Ads - tendencias</h2>
              <p className='text-lg text-text2/80'>Investimento, leads, CPL e CPC</p>
            </div>
            <span className='text-xs text-text2/60 uppercase tracking-[0.35em]'>Base {metaMostRecentLabel}</span>
          </header>
          <div className='flex-1 min-h-[420px]'>
            {metaTrendSeries.length ? (
              <ResponsiveContainer width='100%' height='100%'>
                <ComposedChart data={metaTrendSeries}>
                  <CartesianGrid strokeDasharray='3 3' opacity={0.2} />
                  <XAxis dataKey='date' tickFormatter={formatDay} stroke='rgba(255,255,255,0.4)' fontSize={14} />
                  <YAxis
                    yAxisId='left'
                    tickFormatter={value => fmtMoney(value as number)}
                    stroke='rgba(255,255,255,0.4)'
                    fontSize={14}
                    width={120}
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
                    formatter={(value, _name, item) => {
                      const key = (item?.dataKey as string) || ''
                      if (key === 'leads') return [fmtNum(value as number), META_TREND_LABELS[key]]
                      if (key === 'spend' || key === 'cpl' || key === 'cpc') return [fmtMoney(value as number), META_TREND_LABELS[key]]
                      return [value as number, key]
                    }}
                  />
                  <Legend formatter={(value: string) => META_TREND_LABELS[value] ?? value} />
                  <Area
                    yAxisId='left'
                    type='monotone'
                    dataKey='spend'
                    stroke='#2563eb'
                    fill='#2563eb'
                    fillOpacity={0.16}
                    strokeWidth={3}
                  />
                  <Bar yAxisId='right' dataKey='leads' fill='#22d3ee' radius={[8, 8, 0, 0]} />
                  <Line yAxisId='left' type='monotone' dataKey='cpl' stroke='#facc15' strokeWidth={3} dot={{ r: 3 }} />
                  <Line yAxisId='left' type='monotone' dataKey='cpc' stroke='#f472b6' strokeWidth={3} strokeDasharray='6 4' dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-full flex items-center justify-center text-text2/70 text-2xl'>
                Sem historico suficiente para exibir o grafico.
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'meta-reach',
      node: (
        <div className='rounded-3xl bg-white/10 border border-white/10 p-10 flex flex-col h-full shadow-lg shadow-black/40'>
          <header className='flex items-start justify-between mb-6'>
            <div>
              <h2 className='text-4xl font-semibold tracking-tight'>Meta Ads - alcance e frequencia</h2>
              <p className='text-lg text-text2/80'>Ultimos 30 dias</p>
            </div>
            <span className='text-xs text-text2/60 uppercase tracking-[0.35em]'>Base {metaMostRecentLabel}</span>
          </header>
          <div className='flex-1 min-h-[420px]'>
            {metaReachSeries.length ? (
              <ResponsiveContainer width='100%' height='100%'>
                <ComposedChart data={metaReachSeries}>
                  <CartesianGrid strokeDasharray='3 3' opacity={0.2} />
                  <XAxis dataKey='date' tickFormatter={formatDay} stroke='rgba(255,255,255,0.4)' fontSize={14} />
                  <YAxis
                    yAxisId='left'
                    tickFormatter={value => fmtNum(value as number)}
                    stroke='rgba(255,255,255,0.4)'
                    fontSize={14}
                    width={120}
                  />
                  <YAxis
                    yAxisId='right'
                    orientation='right'
                    tickFormatter={value => (value as number).toFixed(2)}
                    stroke='rgba(255,255,255,0.4)'
                    fontSize={14}
                  />
                  <Tooltip
                    labelFormatter={formatDateLabel}
                    formatter={(value, _name, item) => {
                      const key = (item?.dataKey as string) || ''
                      if (key === 'frequency') return [(value as number).toFixed(2), META_REACH_LABELS[key]]
                      return [fmtNum(value as number), META_REACH_LABELS[key] ?? key]
                    }}
                  />
                  <Legend formatter={(value: string) => META_REACH_LABELS[value] ?? value} />
                  <Bar yAxisId='left' dataKey='reach' fill='#818cf8' radius={[8, 8, 0, 0]} />
                  <Bar yAxisId='left' dataKey='impressions' fill='#38bdf8' radius={[8, 8, 0, 0]} opacity={0.45} />
                  <Line yAxisId='right' type='monotone' dataKey='frequency' stroke='#f97316' strokeWidth={3} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-full flex items-center justify-center text-text2/70 text-2xl'>
                Sem dados de alcance para o periodo selecionado.
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'google-performance',
      node: (
        <div className='rounded-3xl bg-white/10 border border-white/10 p-10 flex flex-col h-full shadow-lg shadow-black/40'>
          <header className='flex items-start justify-between mb-6'>
            <div>
              <h2 className='text-4xl font-semibold tracking-tight'>Google Ads - performance diaria</h2>
              <p className='text-lg text-text2/80'>Investimento, leads, cliques e conversao</p>
            </div>
            <span className='text-xs text-text2/60 uppercase tracking-[0.35em]'>Base {googleMostRecentLabel}</span>
          </header>
          <div className='flex-1 min-h-[420px]'>
            {googlePerformanceSeries.length ? (
              <ResponsiveContainer width='100%' height='100%'>
                <ComposedChart data={googlePerformanceSeries}>
                  <CartesianGrid strokeDasharray='3 3' opacity={0.2} />
                  <XAxis dataKey='date' tickFormatter={formatDay} stroke='rgba(255,255,255,0.4)' fontSize={14} />
                  <YAxis
                    yAxisId='left'
                    tickFormatter={value => fmtMoney(value as number)}
                    stroke='rgba(255,255,255,0.4)'
                    fontSize={14}
                    width={120}
                  />
                  <YAxis
                    yAxisId='right'
                    orientation='right'
                    tickFormatter={value => fmtNum(value as number)}
                    stroke='rgba(255,255,255,0.4)'
                    fontSize={14}
                  />
                  <YAxis
                    yAxisId='conversion'
                    orientation='right'
                    tickFormatter={value => percentLabel(value as number)}
                    stroke='rgba(255,255,255,0.2)'
                    fontSize={12}
                    width={90}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    labelFormatter={formatDateLabel}
                    formatter={(value, _name, item) => {
                      const key = (item?.dataKey as string) || ''
                      if (key === 'spend') return [fmtMoney(value as number), GOOGLE_PERFORMANCE_LABELS[key]]
                      if (key === 'leads' || key === 'clicks') return [fmtNum(value as number), GOOGLE_PERFORMANCE_LABELS[key]]
                      if (key === 'conversion') return [percentLabel(value as number), GOOGLE_PERFORMANCE_LABELS[key]]
                      return [value as number, key]
                    }}
                  />
                  <Legend formatter={(value: string) => GOOGLE_PERFORMANCE_LABELS[value] ?? value} />
                  <Area
                    yAxisId='left'
                    type='monotone'
                    dataKey='spend'
                    stroke='#2563eb'
                    fill='#2563eb'
                    fillOpacity={0.14}
                    strokeWidth={3}
                  />
                  <Bar yAxisId='right' dataKey='leads' fill='#22c55e' radius={[8, 8, 0, 0]} />
                  <Line yAxisId='right' type='monotone' dataKey='clicks' stroke='#facc15' strokeWidth={3} dot={{ r: 3 }} />
                  <Line
                    yAxisId='conversion'
                    type='monotone'
                    dataKey='conversion'
                    stroke='#f97316'
                    strokeWidth={3}
                    strokeDasharray='6 4'
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-full flex items-center justify-center text-text2/70 text-2xl'>
                Sem historico suficiente para exibir o grafico.
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'google-efficiency',
      node: (
        <div className='rounded-3xl bg-white/10 border border-white/10 p-10 flex flex-col h-full shadow-lg shadow-black/40'>
          <header className='flex items-start justify-between mb-6'>
            <div>
              <h2 className='text-4xl font-semibold tracking-tight'>Google Ads - eficiencia de midia</h2>
              <p className='text-lg text-text2/80'>Comparativo de ROAS, CPL e CPC</p>
            </div>
            <span className='text-xs text-text2/60 uppercase tracking-[0.35em]'>Base {googleMostRecentLabel}</span>
          </header>
          <div className='flex-1 min-h-[420px]'>
            {googleEfficiencySeries.length ? (
              <ResponsiveContainer width='100%' height='100%'>
                <ComposedChart data={googleEfficiencySeries}>
                  <CartesianGrid strokeDasharray='3 3' opacity={0.2} />
                  <XAxis dataKey='date' tickFormatter={formatDay} stroke='rgba(255,255,255,0.4)' fontSize={14} />
                  <YAxis
                    yAxisId='left'
                    tickFormatter={value => fmtMoney(value as number)}
                    stroke='rgba(255,255,255,0.4)'
                    fontSize={14}
                    width={120}
                  />
                  <YAxis
                    yAxisId='right'
                    orientation='right'
                    tickFormatter={value => (Number.isFinite(value) ? `${(value as number).toFixed(2)}x` : '-')}
                    stroke='rgba(255,255,255,0.4)'
                    fontSize={14}
                  />
                  <Tooltip
                    labelFormatter={formatDateLabel}
                    formatter={(value, _name, item) => {
                      const key = (item?.dataKey as string) || ''
                      if (key === 'roas') return [`${(value as number).toFixed(2)}x`, GOOGLE_EFFICIENCY_LABELS[key]]
                      return [fmtMoney(value as number), GOOGLE_EFFICIENCY_LABELS[key] ?? key]
                    }}
                  />
                  <Legend formatter={(value: string) => GOOGLE_EFFICIENCY_LABELS[value] ?? value} />
                  <Bar yAxisId='left' dataKey='spend' fill='#60a5fa' radius={[8, 8, 0, 0]} />
                  <Line yAxisId='right' type='monotone' dataKey='roas' stroke='#22c55e' strokeWidth={3} dot={{ r: 3 }} />
                  <Line yAxisId='left' type='monotone' dataKey='cpl' stroke='#f97316' strokeWidth={3} strokeDasharray='6 4' dot={{ r: 3 }} />
                  <Line yAxisId='left' type='monotone' dataKey='cpc' stroke='#a855f7' strokeWidth={3} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-full flex items-center justify-center text-text2/70 text-2xl'>
                Sem dados suficientes para analisar eficiencia de midia.
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'campaigns',
      node: (
        <div className='grid grid-cols-2 gap-6 h-full'>
          <section className='rounded-3xl bg-white/10 border border-white/10 p-8 flex flex-col shadow-lg shadow-black/40'>
            <header className='flex items-start justify-between mb-6'>
              <div>
                <h2 className='text-3xl font-semibold tracking-tight'>Top campanhas Meta Ads</h2>
                <p className='text-base text-text2/80'>Primeiras {metaTopThree.length} por investimento</p>
              </div>
            </header>
            {metaTopThree.length ? (
              <div className='space-y-5 overflow-y-auto pr-2'>
                {metaTopThree.map(item => (
                  <div key={item.key} className='rounded-2xl bg-white/10 border border-white/10 p-6 shadow-inner shadow-black/20'>
                    <div className='flex items-start justify-between gap-4'>
                      <div>
                        <p className='text-lg font-semibold text-text'>{item.campaign}</p>
                        <p className='text-sm text-text2/80 mt-1'>{item.account}</p>
                      </div>
                      <span className='text-sm text-text2/70 whitespace-nowrap'>{fmtMoney(item.spend)}</span>
                    </div>
                    <div className='flex flex-wrap items-center gap-5 mt-4 text-sm'>
                      <span className='text-emerald-300'>Leads {fmtNum(item.leads)}</span>
                      <span className='text-cyan-300'>CPL {fmtMoney(item.cpl)}</span>
                      <span className='text-violet-300'>Conv {percentLabel(item.conversion)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex-1 flex items-center justify-center text-text2/70 text-2xl text-center'>Sem campanhas listadas.</div>
            )}
          </section>
          <section className='rounded-3xl bg-white/10 border border-white/10 p-8 flex flex-col shadow-lg shadow-black/40'>
            <header className='flex items-start justify-between mb-6'>
              <div>
                <h2 className='text-3xl font-semibold tracking-tight'>Top campanhas Google Ads</h2>
                <p className='text-base text-text2/80'>Primeiras {googleTopThree.length} por investimento</p>
              </div>
            </header>
            {googleTopThree.length ? (
              <div className='space-y-5 overflow-y-auto pr-2'>
                {googleTopThree.map(item => (
                  <div key={item.key} className='rounded-2xl bg-white/10 border border-white/10 p-6 shadow-inner shadow-black/20'>
                    <div className='flex items-start justify-between gap-4'>
                      <div>
                        <p className='text-lg font-semibold text-text'>{item.campaign}</p>
                        <p className='text-sm text-text2/80 mt-1'>{item.account}</p>
                      </div>
                      <span className='text-sm text-text2/70 whitespace-nowrap'>{fmtMoney(item.spend)}</span>
                    </div>
                    <div className='flex flex-wrap items-center gap-5 mt-4 text-sm'>
                      <span className='text-emerald-300'>Leads {fmtNum(item.leads)}</span>
                      <span className='text-cyan-300'>CPL {fmtMoney(item.cpl)}</span>
                      <span className='text-orange-300'>ROAS {Number.isFinite(item.roas) ? `${item.roas.toFixed(2)}x` : '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex-1 flex items-center justify-center text-text2/70 text-2xl text-center'>Sem campanhas listadas.</div>
            )}
          </section>
        </div>
      )
    }
  ]

  return (
    <div className='min-h-screen w-full flex items-center justify-center bg-bg text-text py-6 px-6'>
      <div
        className='relative w-[1920px] h-[1080px] rounded-[48px] border border-white/10 overflow-hidden shadow-[0_24px_120px_rgba(0,0,0,0.65)]'
        style={{ background: buildBackground() }}
      >
        <div className='absolute inset-0 bg-black/35 backdrop-blur-[4px]' />
        <div className='relative z-10 flex flex-col h-full px-10 py-10 gap-8'>
          <motion.div
            className='flex items-start justify-between gap-6'
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h1 className='text-5xl font-bold tracking-tight'>Marketing TV</h1>
              <p className='text-2xl text-text2/80 mt-2'>Visao consolidada de Meta Ads e Google Ads</p>
              <div className='mt-4 text-sm text-text2/70 space-y-1'>
                <p>Meta Ads - base {metaMostRecentLabel} | ultima atualizacao {metaLastUpdated}</p>
                <p>Google Ads - base {googleMostRecentLabel} | ultima atualizacao {googleLastUpdated}</p>
              </div>
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
            <span className='text-sm text-text2/70 uppercase tracking-[0.3em]'>Grupo B&O - Marketing Performance</span>
            <div className='flex items-center gap-3'>
              {slides.map((slide, index) => (
                <span
                  key={slide.key}
                  className={`h-3 rounded-full transition-all duration-500 ${currentSlide === index ? 'w-12 bg-neonAqua' : 'w-3 bg-white/30'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
