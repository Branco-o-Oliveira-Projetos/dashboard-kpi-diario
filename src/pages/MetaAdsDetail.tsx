
import { useMemo, useState } from 'react'
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
  cpl: number
  cpc: number
  average_total_spend: number
  taxa_de_conversao: number
  impressions: number
  reach: number
  frequency: number
  date_start: string
  date_stop: string
  updated_at: string
}

interface DailySummary {
  date: string
  spend: number
  leads: number
  clicks: number
  impressions: number
  reach: number
  frequency: number
}

interface CampaignSnapshot {
  key: string
  campaign: string
  account: string
  spend: number
  leads: number
  clicks: number
  impressions: number
  reach: number
  cpl: number
  cpc: number
  conversion: number
}

const percentChange = (current: number, previous: number) => {
  if (previous === 0) {
    if (current === 0) return 0
    return 100
  }
  return ((current - previous) / previous) * 100
}

const safeDivide = (numerator: number, denominator: number) => {
  if (!denominator) return 0
  return numerator / denominator
}

const toPercentageLabel = (value: number) => {
  if (!Number.isFinite(value)) return '-'
  return `${value.toFixed(1)}%`
}


const TREND_LABELS: Record<string, string> = {
  spend: 'Investimento',
  leads: 'Leads',
  cpl: 'CPL',
  cpc: 'CPC',
  conversion: 'Conversão',
}

const REACH_LABELS: Record<string, string> = {
  reach: 'Alcance',
  impressions: 'Impressões',
  frequency: 'Frequência',
}
export default function MetaAdsDetail() {
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['meta-ads-detail'],
    queryFn: () => fetchDetailedData('meta_ads'),
    refetchInterval: 2 * 60 * 1000
  })

  const records = useMemo<MetaAdsRecord[]>(() => {
    if (!Array.isArray(data)) return []
    return (data as MetaAdsRecord[]).filter(item => !!item.ref_date)
  }, [data])

  const availableCampaigns = useMemo(() => {
    return Array.from(new Set(records.map(record => record.campaign_name).filter(Boolean))).sort()
  }, [records])

  const availableAccounts = useMemo(() => {
    return Array.from(new Set(records.map(record => record.account_name).filter(Boolean))).sort()
  }, [records])

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesCampaign = !selectedCampaign || record.campaign_name === selectedCampaign
      const matchesAccount = !selectedAccount || record.account_name === selectedAccount
      return matchesCampaign && matchesAccount
    })
  }, [records, selectedCampaign, selectedAccount])

  const orderedDates = useMemo(() => {
    return Array.from(new Set(filteredRecords.map(record => record.ref_date)))
      .sort((a, b) => new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime())
  }, [filteredRecords])

  const mostRecentDate = orderedDates[0] ?? ''
  const previousDate = orderedDates[1] ?? ''

  const todayRecords = useMemo(() => {
    return filteredRecords.filter(record => record.ref_date === mostRecentDate)
  }, [filteredRecords, mostRecentDate])

  const previousDayRecords = useMemo(() => {
    return filteredRecords.filter(record => record.ref_date === previousDate)
  }, [filteredRecords, previousDate])

  const aggregateDay = (recordsForDay: MetaAdsRecord[]) => {
    return recordsForDay.reduce(
      (acc, record) => {
        acc.spend += record.cost || 0
        acc.leads += record.leads || 0
        acc.clicks += record.clicks || 0
        acc.impressions += record.impressions || 0
        acc.reach += record.reach || 0
        acc.frequency += record.frequency || 0
        acc.items += 1
        return acc
      },
      {
        spend: 0,
        leads: 0,
        clicks: 0,
        impressions: 0,
        reach: 0,
        frequency: 0,
        items: 0
      }
    )
  }

  const todayTotals = useMemo(() => aggregateDay(todayRecords), [todayRecords])
  const previousTotals = useMemo(() => aggregateDay(previousDayRecords), [previousDayRecords])

  const averageFrequencyToday = todayTotals.items > 0 ? todayTotals.frequency / todayTotals.items : 0

  const spendDelta = percentChange(todayTotals.spend, previousTotals.spend)
  const leadsDelta = percentChange(todayTotals.leads, previousTotals.leads)
  const conversionToday = safeDivide(todayTotals.leads, todayTotals.clicks) * 100
  const conversionDelta = percentChange(conversionToday, safeDivide(previousTotals.leads, previousTotals.clicks) * 100)

  const lastUpdatedLabel = useMemo(() => {
    const latestTimestamp = filteredRecords.reduce((latest, record) => {
      const current = record.updated_at ? new Date(record.updated_at).getTime() : 0
      return current > latest ? current : latest
    }, 0)
    return latestTimestamp ? new Date(latestTimestamp).toLocaleString('pt-BR') : '-'
  }, [filteredRecords])

  const dailySeries = useMemo<DailySummary[]>(() => {
    const map = new Map<string, DailySummary>()
    filteredRecords.forEach(record => {
      const existing = map.get(record.ref_date)
      if (existing) {
        existing.spend += record.cost || 0
        existing.leads += record.leads || 0
        existing.clicks += record.clicks || 0
        existing.impressions += record.impressions || 0
        existing.reach += record.reach || 0
        existing.frequency += record.frequency || 0
      } else {
        map.set(record.ref_date, {
          date: record.ref_date,
          spend: record.cost || 0,
          leads: record.leads || 0,
          clicks: record.clicks || 0,
          impressions: record.impressions || 0,
          reach: record.reach || 0,
          frequency: record.frequency || 0
        })
      }
    })

    return Array.from(map.values())
      .sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime())
      .slice(-30)
  }, [filteredRecords])

  const trendSeries = useMemo(() => {
    return dailySeries.map(item => ({
      date: item.date,
      spend: item.spend,
      leads: item.leads,
      cpl: safeDivide(item.spend, item.leads),
      cpc: safeDivide(item.spend, item.clicks),
      conversion: safeDivide(item.leads, item.clicks) * 100
    }))
  }, [dailySeries])

  const reachSeries = useMemo(() => {
    return dailySeries.map(item => ({
      date: item.date,
      impressions: item.impressions,
      reach: item.reach,
      frequency: item.reach ? safeDivide(item.impressions, item.reach) : 0
    }))
  }, [dailySeries])

  const campaignSnapshots = useMemo<CampaignSnapshot[]>(() => {
    const source = todayRecords.length ? todayRecords : filteredRecords
    const map = new Map<string, CampaignSnapshot>()

    source.forEach(record => {
      const key = `${record.campaign_id}-${record.account_id}`
      const entry = map.get(key)
      if (entry) {
        entry.spend += record.cost || 0
        entry.leads += record.leads || 0
        entry.clicks += record.clicks || 0
        entry.impressions += record.impressions || 0
        entry.reach += record.reach || 0
      } else {
        map.set(key, {
          key,
          campaign: record.campaign_name || 'Campanha sem nome',
          account: record.account_name || 'Conta não identificada',
          spend: record.cost || 0,
          leads: record.leads || 0,
          clicks: record.clicks || 0,
          impressions: record.impressions || 0,
          reach: record.reach || 0,
          cpl: 0,
          cpc: 0,
          conversion: 0
        })
      }
    })

    const list = Array.from(map.values()).map(entry => {
      const cpl = safeDivide(entry.spend, entry.leads)
      const cpc = safeDivide(entry.spend, entry.clicks)
      const conversion = safeDivide(entry.leads, entry.clicks) * 100
      return {
        ...entry,
        cpl,
        cpc,
        conversion
      }
    })

    return list.sort((a, b) => b.spend - a.spend).slice(0, 15)
  }, [filteredRecords, todayRecords])

  if (isLoading) {
    return (
      <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text">
        <div className="mb-6 space-y-3">
          <motion.div className="h-8 bg-bg2 rounded-lg" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.4, repeat: Infinity }} />
          <motion.div className="h-4 bg-bg2 rounded-lg w-1/3" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.15 }} />
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
        Erro ao carregar dados do Meta Ads.
      </div>
    )
  }

  if (!filteredRecords.length) {
    return (
      <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text">
        <motion.div className="card text-center py-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          Nenhum dado disponível para Meta Ads com os filtros atuais.
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text">
      <motion.div className="mb-6" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <motion.h1 className="text-2xl sm:text-3xl font-bold text-text mb-2 flex flex-wrap items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          Meta Ads – Visão Estratégica
        </motion.h1>
        <motion.div className="flex flex-wrap items-center gap-4 text-text2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <span>Referência: {mostRecentDate ? new Date(mostRecentDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</span>
          <span className="text-xs bg-bg2/60 text-text px-2 py-1 rounded-md">Última sincronização: {lastUpdatedLabel}</span>
        </motion.div>
        <motion.div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}>
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedAccount}
              onChange={event => setSelectedAccount(event.target.value)}
              className="bg-bg2 border border-bg2/60 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/70"
            >
              <option value="">Todas as contas</option>
              {availableAccounts.map(account => (
                <option key={account} value={account}>{account}</option>
              ))}
            </select>
            <select
              value={selectedCampaign}
              onChange={event => setSelectedCampaign(event.target.value)}
              className="bg-bg2 border border-bg2/60 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/70"
            >
              <option value="">Todas as campanhas</option>
              {availableCampaigns.map(campaign => (
                <option key={campaign} value={campaign}>{campaign}</option>
              ))}
            </select>
          </div>
          <Link to="/" className="text-blue-400 hover:underline inline-flex items-center gap-2 group">
            <motion.span whileHover={{ x: -4 }} transition={{ type: 'spring', stiffness: 320 }}>
              Voltar ao dashboard
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Investimento do dia</p>
          <p className="text-lg sm:text-xl font-semibold">{fmtMoney(todayTotals.spend)}</p>
          <p className="text-xs text-text2">Variação vs dia anterior: {toPercentageLabel(spendDelta)}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Leads confirmados</p>
          <p className="text-lg sm:text-xl font-semibold text-emerald-300">{fmtNum(todayTotals.leads)}</p>
          <p className="text-xs text-text2">Variação vs dia anterior: {toPercentageLabel(leadsDelta)}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Custo por lead</p>
          <p className="text-lg sm:text-xl font-semibold text-cyan-300">{fmtMoney(safeDivide(todayTotals.spend, todayTotals.leads))}</p>
          <p className="text-xs text-text2">CPC médio: {fmtMoney(safeDivide(todayTotals.spend, todayTotals.clicks))}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Taxa de conversão</p>
          <p className={`text-lg sm:text-xl font-semibold ${conversionToday >= 10 ? 'text-emerald-300' : 'text-text'}`}>{toPercentageLabel(conversionToday)}</p>
          <p className="text-xs text-text2">Variação vs dia anterior: {toPercentageLabel(conversionDelta)}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Cliques</p>
          <p className="text-lg sm:text-xl font-semibold text-blue-300">{fmtNum(todayTotals.clicks)}</p>
          <p className="text-xs text-text2">CTR (leads/cliques): {toPercentageLabel(conversionToday)}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Impressões</p>
          <p className="text-lg sm:text-xl font-semibold">{fmtNum(todayTotals.impressions)}</p>
          <p className="text-xs text-text2">Alcance único: {fmtNum(todayTotals.reach)}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Frequência média</p>
          <p className="text-lg sm:text-xl font-semibold">{averageFrequencyToday.toFixed(2)}</p>
          <p className="text-xs text-text2">Pessoas impactadas em média</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Campanhas ativas</p>
          <p className="text-lg sm:text-xl font-semibold">{new Set(todayRecords.map(record => record.campaign_id)).size || filteredRecords.length}</p>
          <p className="text-xs text-text2">Contas filtradas: {new Set(todayRecords.map(record => record.account_id)).size || availableAccounts.length}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} whileHover={{ y: -2 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-sm sm:text-lg">Pulso diário: investimento x geração de demanda</h3>
            <span className="text-xs text-text2">Últimos 30 dias</span>
          </div>
          <div className="h-72">
            {trendSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendSeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tickFormatter={value => new Date(value + 'T00:00:00').getDate().toString()} fontSize={10} />
                  <YAxis yAxisId="left" fontSize={10} tickFormatter={value => fmtMoney(value as number)} width={90} />
                  <YAxis yAxisId="right" orientation="right" fontSize={10} tickFormatter={value => fmtNum(value as number)} />
                  <Tooltip
                    labelFormatter={value => new Date(value + 'T00:00:00').toLocaleDateString('pt-BR')}
                    formatter={(value, _name, item) => {
                      const key = (item?.dataKey as string) || ''
                      switch (key) {
                        case 'leads':
                          return [fmtNum(value as number), 'Leads']
                        case 'cpl':
                          return [fmtMoney(value as number), 'CPL']
                        case 'cpc':
                          return [fmtMoney(value as number), 'CPC']
                        case 'conversion':
                          return [toPercentageLabel(value as number), 'Conversão']
                        case 'spend':
                        default:
                          return [fmtMoney(value as number), 'Investimento']
                      }
                    }}
                  />
                  <Legend
                    formatter={(value, entry) => {
                      const key = (entry?.dataKey as string) || value
                      return TREND_LABELS[key] ?? value
                    }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="spend" stroke="#2563eb" fill="#2563eb" fillOpacity={0.14} strokeWidth={2} name="Investimento" />
                  <Bar yAxisId="right" dataKey="leads" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Leads" />
                  <Line yAxisId="left" type="monotone" dataKey="cpl" stroke="#facc15" strokeWidth={2} dot={{ r: 2 }} name="CPL" />
                  <Line yAxisId="left" type="monotone" dataKey="cpc" stroke="#f472b6" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} name="CPC" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text2 text-sm">
                Sem histórico disponível para compor a análise.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} whileHover={{ y: -2 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-sm sm:text-lg">Audiência alcançada</h3>
            <span className="text-xs text-text2">Últimos 30 dias</span>
          </div>
          <div className="h-72">
            {reachSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={reachSeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tickFormatter={value => new Date(value + 'T00:00:00').getDate().toString()} fontSize={10} />
                  <YAxis yAxisId="left" fontSize={10} tickFormatter={value => fmtNum(value as number)} width={90} />
                  <YAxis yAxisId="right" orientation="right" fontSize={10} tickFormatter={value => (value as number).toFixed(1)} />
                  <Tooltip
                    labelFormatter={value => new Date(value + 'T00:00:00').toLocaleDateString('pt-BR')}
                    formatter={(value, _name, item) => {
                      const key = (item?.dataKey as string) || ''
                      switch (key) {
                        case 'reach':
                          return [fmtNum(value as number), 'Alcance']
                        case 'impressions':
                          return [fmtNum(value as number), 'Impressões']
                        case 'frequency':
                          return [(value as number).toFixed(2), 'Frequência']
                        default:
                          return [fmtNum(value as number), key]
                      }
                    }}
                  />
                  <Legend
                    formatter={(value, entry) => {
                      const key = (entry?.dataKey as string) || value
                      return REACH_LABELS[key] ?? value
                    }}
                  />
                  <Bar yAxisId="left" dataKey="reach" fill="#818cf8" radius={[4, 4, 0, 0]} name="Alcance" />
                  <Bar yAxisId="left" dataKey="impressions" fill="#38bdf8" radius={[4, 4, 0, 0]} opacity={0.4} name="Impressões" />
                  <Line yAxisId="right" type="monotone" dataKey="frequency" stroke="#f97316" strokeWidth={3} dot={{ r: 2 }} name="Frequência" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text2 text-sm">
                Ainda não há dados suficientes para o período.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} whileHover={{ y: -2 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="card-title">Campanhas que ditam o resultado</h3>
          <span className="text-xs text-text2">{campaignSnapshots.length} campanhas analisadas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-bg2">
                <th className="text-left p-2">Campanha</th>
                <th className="text-left p-2">Conta</th>
                <th className="text-right p-2">Investimento</th>
                <th className="text-right p-2">Leads</th>
                <th className="text-right p-2">Cliques</th>
                <th className="text-right p-2">CPL</th>
                <th className="text-right p-2">CPC</th>
                <th className="text-right p-2">Conversão</th>
                <th className="text-right p-2">Alcance</th>
              </tr>
            </thead>
            <tbody>
              {campaignSnapshots.length ? (
                campaignSnapshots.map((campaign, index) => (
                  <motion.tr
                    key={campaign.key}
                    className="border-b border-bg2/40 hover:bg-bg2/20"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03 }}
                  >
                    <td className="p-2 truncate max-w-[220px]" title={campaign.campaign}>{campaign.campaign}</td>
                    <td className="p-2 truncate max-w-[160px]" title={campaign.account}>{campaign.account}</td>
                    <td className="p-2 text-right">{fmtMoney(campaign.spend)}</td>
                    <td className="p-2 text-right text-emerald-300">{fmtNum(campaign.leads)}</td>
                    <td className="p-2 text-right">{fmtNum(campaign.clicks)}</td>
                    <td className="p-2 text-right">{fmtMoney(campaign.cpl)}</td>
                    <td className="p-2 text-right">{fmtMoney(campaign.cpc)}</td>
                    <td className="p-2 text-right">{toPercentageLabel(campaign.conversion)}</td>
                    <td className="p-2 text-right">{fmtNum(campaign.reach)}</td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center text-text2 p-4">
                    Não encontramos campanhas para o período selecionado.
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
