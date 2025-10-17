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

type NumericLike = number | string | null | undefined

interface MetaRecord {
  refDate: string
  account: string
  campaign: string
  spend: number
  leads: number
  clicks: number
  impressions: number
  reach: number
  frequency: number
  updatedAt: string
}

interface GoogleRecord {
  refDate: string
  account: string
  campaign: string
  spend: number
  leads: number
  clicks: number
  impressions: number
  roas: number
  updatedAt: string
}

interface DailyMetaSummary {
  date: string
  spend: number
  leads: number
  clicks: number
  impressions: number
  reach: number
  frequency: number
}

interface DailyGoogleSummary {
  date: string
  spend: number
  leads: number
  clicks: number
  impressions: number
  roas: number
}

interface MetaCampaignSummary {
  key: string
  campaign: string
  account: string
  spend: number
  leads: number
  clicks: number
  cpl: number
  conversion: number
}

interface GoogleCampaignSummary {
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
  accentClass: string
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

const toNumber = (value: NumericLike): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const normalized = value.replace(/\s/g, '').replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const percentLabel = (value: number) => {
  if (!Number.isFinite(value)) return '-'
  return `${value.toFixed(1)}%`
}

const formatDateLabel = (value: string) => {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR')
}

const formatDayLabel = (value: string) => {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.getDate().toString().padStart(2, '0')
}

const buildBackground = () =>
  'radial-gradient(circle at top left, rgba(0, 168, 224, 0.22), transparent 55%), radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.18), transparent 45%)'

const resolveLastUpdatedLabel = (records: { updatedAt: string }[]) => {
  const latestTimestamp = records.reduce((latest, record) => {
    const current = record.updatedAt ? new Date(record.updatedAt).getTime() : 0
    return current > latest ? current : latest
  }, 0)
  return latestTimestamp ? new Date(latestTimestamp).toLocaleString('pt-BR') : '-'
}

const useMetaData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['meta-ads-tv'],
    queryFn: () => fetchDetailedData('meta_ads'),
    refetchInterval: 2 * 60 * 1000
  })

  const records = useMemo<MetaRecord[]>(() => {
    if (!Array.isArray(data)) return []
    return (data as any[])
      .filter(item => item?.ref_date)
      .map(item => ({
        refDate: item.ref_date as string,
        account: (item.account_name as string) ?? 'Conta sem nome',
        campaign: (item.campaign_name as string) ?? 'Campanha sem nome',
        spend: toNumber(item.cost),
        leads: toNumber(item.leads),
        clicks: toNumber(item.clicks),
        impressions: toNumber(item.impressions),
        reach: toNumber(item.reach),
        frequency: toNumber(item.frequency),
        updatedAt: (item.updated_at as string) ?? ''
      }))
  }, [data])

  const dailySeries = useMemo<DailyMetaSummary[]>(() => {
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
        samples: number
      }
    >()

    records.forEach(record => {
      const current = map.get(record.refDate)
      if (current) {
        current.spend += record.spend
        current.leads += record.leads
        current.clicks += record.clicks
        current.impressions += record.impressions
        current.reach += record.reach
        current.frequency += record.frequency
        current.samples += 1
      } else {
        map.set(record.refDate, {
          date: record.refDate,
          spend: record.spend,
          leads: record.leads,
          clicks: record.clicks,
          impressions: record.impressions,
          reach: record.reach,
          frequency: record.frequency,
          samples: 1
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
        frequency: entry.samples ? entry.frequency / entry.samples : 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
  }, [records])

  const campaigns = useMemo<MetaCampaignSummary[]>(() => {
    const map = new Map<
      string,
      {
        key: string
        campaign: string
        account: string
        spend: number
        leads: number
        clicks: number
      }
    >()

    records.forEach(record => {
      const key = `${record.campaign}-${record.account}`
      const current = map.get(key)
      if (current) {
        current.spend += record.spend
        current.leads += record.leads
        current.clicks += record.clicks
      } else {
        map.set(key, {
          key,
          campaign: record.campaign,
          account: record.account,
          spend: record.spend,
          leads: record.leads,
          clicks: record.clicks
        })
      }
    })

    return Array.from(map.values())
      .map(entry => ({
        key: entry.key,
        campaign: entry.campaign,
        account: entry.account,
        spend: entry.spend,
        leads: entry.leads,
        clicks: entry.clicks,
        cpl: entry.leads ? entry.spend / entry.leads : 0,
        conversion: entry.clicks ? (entry.leads / entry.clicks) * 100 : 0
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 3)
  }, [records])

  const latestDaily = dailySeries[dailySeries.length - 1]
  const lastUpdated = resolveLastUpdatedLabel(records)

  return {
    isLoading,
    error,
    records,
    dailySeries,
    latestDaily,
    campaigns,
    lastUpdated
  }
}
const useGoogleData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['google-ads-tv'],
    queryFn: () => fetchDetailedData('google_ads'),
    refetchInterval: 2 * 60 * 1000
  })

  const records = useMemo<GoogleRecord[]>(() => {
    if (!Array.isArray(data)) return []
    return (data as any[])
      .filter(item => item?.ref_date)
      .map(item => ({
        refDate: item.ref_date as string,
        account: (item.account_name as string) ?? 'Conta sem nome',
        campaign: (item.campaign_name as string) ?? 'Campanha sem nome',
        spend: toNumber(item.cost),
        leads: toNumber(item.leads),
        clicks: toNumber(item.clicks),
        impressions: toNumber(item.impressions),
        roas: toNumber(item.roas),
        updatedAt: (item.updated_at as string) ?? ''
      }))
  }, [data])

  const dailySeries = useMemo<DailyGoogleSummary[]>(() => {
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

    records.forEach(record => {
      const current = map.get(record.refDate)
      if (current) {
        current.spend += record.spend
        current.leads += record.leads
        current.clicks += record.clicks
        current.impressions += record.impressions
        current.weightedRoas += record.roas * record.spend
        current.roasWeight += record.spend
      } else {
        map.set(record.refDate, {
          date: record.refDate,
          spend: record.spend,
          leads: record.leads,
          clicks: record.clicks,
          impressions: record.impressions,
          weightedRoas: record.roas * record.spend,
          roasWeight: record.spend
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
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
  }, [records])

  const campaigns = useMemo<GoogleCampaignSummary[]>(() => {
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

    records.forEach(record => {
      const key = `${record.campaign}-${record.account}`
      const current = map.get(key)
      if (current) {
        current.spend += record.spend
        current.leads += record.leads
        current.clicks += record.clicks
        current.weightedRoas += record.roas * record.spend
        current.roasWeight += record.spend
      } else {
        map.set(key, {
          key,
          campaign: record.campaign,
          account: record.account,
          spend: record.spend,
          leads: record.leads,
          clicks: record.clicks,
          weightedRoas: record.roas * record.spend,
          roasWeight: record.spend
        })
      }
    })

    return Array.from(map.values())
      .map(entry => ({
        key: entry.key,
        campaign: entry.campaign,
        account: entry.account,
        spend: entry.spend,
        leads: entry.leads,
        clicks: entry.clicks,
        cpl: entry.leads ? entry.spend / entry.leads : 0,
        roas: entry.roasWeight ? entry.weightedRoas / entry.roasWeight : 0
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 3)
  }, [records])

  const latestDaily = dailySeries[dailySeries.length - 1]
  const lastUpdated = resolveLastUpdatedLabel(records)

  return {
    isLoading,
    error,
    records,
    dailySeries,
    latestDaily,
    campaigns,
    lastUpdated
  }
}

export default function MarketingTV() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [clock, setClock] = useState(() => new Date())

  const meta = useMetaData()
  const google = useGoogleData()

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1_000)
    return () => clearInterval(timer)
  }, [])

  const slides = useMemo(() => {
    const metaOverviewCards: MetricCard[] = meta.latestDaily
      ? [
          {
            label: 'Investimento do dia',
            value: fmtMoney(meta.latestDaily.spend),
            description: `Leads ${fmtNum(meta.latestDaily.leads)} | CPL ${fmtMoney(
              meta.latestDaily.leads ? meta.latestDaily.spend / meta.latestDaily.leads : 0
            )}`,
            accentClass: 'text-blue-300'
          },
          {
            label: 'Conversao de leads',
            value: percentLabel(meta.latestDaily.clicks ? (meta.latestDaily.leads / meta.latestDaily.clicks) * 100 : 0),
            description: `Cliques ${fmtNum(meta.latestDaily.clicks)} | CPC ${fmtMoney(
              meta.latestDaily.clicks ? meta.latestDaily.spend / meta.latestDaily.clicks : 0
            )}`,
            accentClass: 'text-violet-300'
          },
          {
            label: 'Alcance diario',
            value: fmtNum(meta.latestDaily.reach),
            description: `Impressoes ${fmtNum(meta.latestDaily.impressions)} | Frequencia ${meta.latestDaily.frequency.toFixed(2)}`,
            accentClass: 'text-orange-300'
          },
          {
            label: 'Leads confirmados',
            value: fmtNum(meta.latestDaily.leads),
            description: 'Meta Ads - total consolidado',
            accentClass: 'text-emerald-300'
          }
        ]
      : []

    const googleOverviewCards: MetricCard[] = google.latestDaily
      ? [
          {
            label: 'Investimento do dia',
            value: fmtMoney(google.latestDaily.spend),
            description: `Leads ${fmtNum(google.latestDaily.leads)} | CPL ${fmtMoney(
              google.latestDaily.leads ? google.latestDaily.spend / google.latestDaily.leads : 0
            )}`,
            accentClass: 'text-blue-300'
          },
          {
            label: 'ROAS medio',
            value: Number.isFinite(google.latestDaily.roas) ? `${google.latestDaily.roas.toFixed(2)}x` : '-',
            description: `Conversao ${percentLabel(
              google.latestDaily.clicks ? (google.latestDaily.leads / google.latestDaily.clicks) * 100 : 0
            )}`,
            accentClass: 'text-emerald-300'
          },
          {
            label: 'Cliques gerados',
            value: fmtNum(google.latestDaily.clicks),
            description: `CPC ${fmtMoney(google.latestDaily.clicks ? google.latestDaily.spend / google.latestDaily.clicks : 0)}`,
            accentClass: 'text-cyan-300'
          },
          {
            label: 'Impressoes totais',
            value: fmtNum(google.latestDaily.impressions),
            description: `Leads/impressoes ${percentLabel(
              google.latestDaily.impressions ? (google.latestDaily.leads / google.latestDaily.impressions) * 100 : 0
            )}`,
            accentClass: 'text-orange-300'
          }
        ]
      : []

    return [
      {
        key: 'overview',
        node: (
          <div className='grid grid-cols-2 gap-6 h-full'>
            <section className='rounded-3xl bg-white/10 border border-white/10 p-8 flex flex-col shadow-lg shadow-black/40'>
              <header className='flex items-start justify-between mb-6'>
                <div>
                  <h2 className='text-3xl font-semibold tracking-tight'>Meta Ads</h2>
                  <p className='text-base text-text2/80'>Base {meta.latestDaily ? formatDateLabel(meta.latestDaily.date) : '-'}</p>
                </div>
                <span className='text-xs text-text2/60 uppercase tracking-[0.35em] max-w-[200px] text-right'>
                  Ultima atualizacao {meta.lastUpdated}
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
                      <span className={`text-4xl font-semibold mt-4 ${card.accentClass}`}>{card.value}</span>
                      {card.description ? <span className='text-base text-text2/80 mt-4'>{card.description}</span> : null}
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
                  <p className='text-base text-text2/80'>Base {google.latestDaily ? formatDateLabel(google.latestDaily.date) : '-'}</p>
                </div>
                <span className='text-xs text-text2/60 uppercase tracking-[0.35em] max-w-[200px] text-right'>
                  Ultima atualizacao {google.lastUpdated}
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
                      <span className={`text-4xl font-semibold mt-4 ${card.accentClass}`}>{card.value}</span>
                      {card.description ? <span className='text-base text-text2/80 mt-4'>{card.description}</span> : null}
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
                <p className='text-lg text-text2/80'>Investimento, leads, CPL e CPC nos ultimos 30 dias</p>
              </div>
              <span className='text-xs text-text2/60 uppercase tracking-[0.35em]'>
                Base {meta.latestDaily ? formatDateLabel(meta.latestDaily.date) : '-'}
              </span>
            </header>
            <div className='flex-1 min-h-[420px]'>
              {meta.dailySeries.length ? (
                <ResponsiveContainer width='100%' height='100%'>
                  <ComposedChart data={meta.dailySeries}>
                    <CartesianGrid strokeDasharray='3 3' opacity={0.2} />
                    <XAxis dataKey='date' tickFormatter={formatDayLabel} stroke='rgba(255,255,255,0.4)' fontSize={14} />
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
                        if (key === 'spend' || key === 'cpl' || key === 'cpc') {
                          return [fmtMoney(value as number), META_TREND_LABELS[key]]
                        }
                        return [value as number, key]
                      }}
                    />
                    <Legend formatter={(value: string) => META_TREND_LABELS[value] ?? value} />
                    <Area yAxisId='left' type='monotone' dataKey='spend' stroke='#2563eb' fill='#2563eb' fillOpacity={0.16} strokeWidth={3} />
                    <Bar yAxisId='right' dataKey='leads' fill='#22d3ee' radius={[8, 8, 0, 0]} />
                    <Line yAxisId='left' type='monotone' dataKey='cpl' stroke='#facc15' strokeWidth={3} dot={{ r: 3 }} />
                    <Line
                      yAxisId='left'
                      type='monotone'
                      dataKey='cpc'
                      stroke='#f472b6'
                      strokeWidth={3}
                      strokeDasharray='6 4'
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className='h-full flex items-center justify-center text-text2/70 text-2xl'>Sem historico disponivel.</div>
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
              <span className='text-xs text-text2/60 uppercase tracking-[0.35em]'>
                Base {meta.latestDaily ? formatDateLabel(meta.latestDaily.date) : '-'}
              </span>
            </header>
            <div className='flex-1 min-h-[420px]'>
              {meta.dailySeries.length ? (
                <ResponsiveContainer width='100%' height='100%'>
                  <ComposedChart data={meta.dailySeries}>
                    <CartesianGrid strokeDasharray='3 3' opacity={0.2} />
                    <XAxis dataKey='date' tickFormatter={formatDayLabel} stroke='rgba(255,255,255,0.4)' fontSize={14} />
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
                        if (key === 'frequency') {
                          return [(value as number).toFixed(2), META_REACH_LABELS[key]]
                        }
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
                <div className='h-full flex items-center justify-center text-text2/70 text-2xl'>Sem dados de alcance.</div>
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
              <span className='text-xs text-text2/60 uppercase tracking-[0.35em]'>
                Base {google.latestDaily ? formatDateLabel(google.latestDaily.date) : '-'}
              </span>
            </header>
            <div className='flex-1 min-h-[420px]'>
              {google.dailySeries.length ? (
                <ResponsiveContainer width='100%' height='100%'>
                  <ComposedChart data={google.dailySeries}>
                    <CartesianGrid strokeDasharray='3 3' opacity={0.2} />
                    <XAxis dataKey='date' tickFormatter={formatDayLabel} stroke='rgba(255,255,255,0.4)' fontSize={14} />
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
                      width={80}
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
                    <Area yAxisId='left' type='monotone' dataKey='spend' stroke='#2563eb' fill='#2563eb' fillOpacity={0.14} strokeWidth={3} />
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
                <div className='h-full flex items-center justify-center text-text2/70 text-2xl'>Sem historico disponivel.</div>
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
              <span className='text-xs text-text2/60 uppercase tracking-[0.35em]'>
                Base {google.latestDaily ? formatDateLabel(google.latestDaily.date) : '-'}
              </span>
            </header>
            <div className='flex-1 min-h-[420px]'>
              {google.dailySeries.length ? (
                <ResponsiveContainer width='100%' height='100%'>
                  <ComposedChart data={google.dailySeries}>
                    <CartesianGrid strokeDasharray='3 3' opacity={0.2} />
                    <XAxis dataKey='date' tickFormatter={formatDayLabel} stroke='rgba(255,255,255,0.4)' fontSize={14} />
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
                    <Line
                      yAxisId='left'
                      type='monotone'
                      dataKey='cpl'
                      stroke='#f97316'
                      strokeWidth={3}
                      strokeDasharray='6 4'
                      dot={{ r: 3 }}
                    />
                    <Line yAxisId='left' type='monotone' dataKey='cpc' stroke='#a855f7' strokeWidth={3} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className='h-full flex items-center justify-center text-text2/70 text-2xl'>Sem dados suficientes.</div>
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
                  <p className='text-base text-text2/80'>Top {meta.campaigns.length} por investimento</p>
                </div>
              </header>
              {meta.campaigns.length ? (
                <div className='space-y-5 overflow-y-auto pr-2'>
                  {meta.campaigns.map(item => (
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
                  <p className='text-base text-text2/80'>Top {google.campaigns.length} por investimento</p>
                </div>
              </header>
              {google.campaigns.length ? (
                <div className='space-y-5 overflow-y-auto pr-2'>
                  {google.campaigns.map(item => (
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
  }, [google.campaigns, google.dailySeries, google.lastUpdated, google.latestDaily, meta.campaigns, meta.dailySeries, meta.lastUpdated, meta.latestDaily])

  const slideCount = slides.length

  useEffect(() => {
    if (!slideCount) return
    setCurrentSlide(0)
  }, [slideCount])

  useEffect(() => {
    if (slideCount <= 1) return
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slideCount)
    }, SLIDE_DURATION_MS)
    return () => clearInterval(interval)
  }, [slideCount])

  if (meta.isLoading || google.isLoading) {
    return (
      <div className='min-h-screen w-full flex items-center justify-center bg-bg text-text text-xl'>
        Carregando visao de marketing...
      </div>
    )
  }

  if (meta.error || google.error) {
    return (
      <div className='min-h-screen w-full flex items-center justify-center bg-bg text-neonPink text-2xl font-semibold text-center px-6'>
        Erro ao carregar dados de marketing.
      </div>
    )
  }

  if (!meta.records.length && !google.records.length) {
    return (
      <div className='min-h-screen w-full flex items-center justify-center bg-bg text-text text-xl'>
        Nenhum dado disponivel para Meta Ads ou Google Ads no momento.
      </div>
    )
  }

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
                <p>Meta Ads - base {meta.latestDaily ? formatDateLabel(meta.latestDaily.date) : '-'} | ultima atualizacao {meta.lastUpdated}</p>
                <p>
                  Google Ads - base {google.latestDaily ? formatDateLabel(google.latestDaily.date) : '-'} | ultima atualizacao {google.lastUpdated}
                </p>
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
