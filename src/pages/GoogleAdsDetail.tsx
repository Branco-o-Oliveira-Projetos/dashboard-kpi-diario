
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

interface GoogleAdsRecord {
  ref_date: string
  account_id: string
  account_name: string
  campaign_name: string
  cost: number
  leads: number
  clicks: number
  cpl: number
  cpc: number
  roas: number
  impressions: number
  gasto_medio: number
  updated_at: string
}

interface DailySummary {
  date: string
  spend: number
  leads: number
  clicks: number
  impressions: number
  weightedRoas: number
  roasWeight: number
}

interface CampaignSnapshot {
  key: string
  campaign: string
  account: string
  spend: number
  leads: number
  clicks: number
  impressions: number
  cpl: number
  cpc: number
  roas: number
}

const safeDivide = (numerator: number, denominator: number) => {
  if (!denominator) return 0
  return numerator / denominator
}

const percentChange = (current: number, previous: number) => {
  if (previous === 0) {
    if (current === 0) return 0
    return 100
  }
  return ((current - previous) / previous) * 100
}

const percentLabel = (value: number) => {
  if (!Number.isFinite(value)) return '-'
  return `${value.toFixed(1)}%`
}

export default function GoogleAdsDetail() {
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['google-ads-detail'],
    queryFn: () => fetchDetailedData('google_ads'),
    refetchInterval: 2 * 60 * 1000
  })

  const records = useMemo<GoogleAdsRecord[]>(() => {
    if (!Array.isArray(data)) return []
    return (data as GoogleAdsRecord[]).filter(item => !!item.ref_date)
  }, [data])

  const availableAccounts = useMemo(() => {
    return Array.from(new Set(records.map(record => record.account_name).filter(Boolean))).sort()
  }, [records])

  const availableCampaigns = useMemo(() => {
    return Array.from(new Set(records.map(record => record.campaign_name).filter(Boolean))).sort()
  }, [records])

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const accountMatch = !selectedAccount || record.account_name === selectedAccount
      const campaignMatch = !selectedCampaign || record.campaign_name === selectedCampaign
      return accountMatch && campaignMatch
    })
  }, [records, selectedAccount, selectedCampaign])

  const orderedDates = useMemo(() => {
    return Array.from(new Set(filteredRecords.map(record => record.ref_date)))
      .sort((a, b) => new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime())
  }, [filteredRecords])

  const mostRecentDate = orderedDates[0] ?? ''
  const previousDate = orderedDates[1] ?? ''

  const todayRecords = useMemo(() => {
    return filteredRecords.filter(record => record.ref_date === mostRecentDate)
  }, [filteredRecords, mostRecentDate])

  const previousRecords = useMemo(() => {
    return filteredRecords.filter(record => record.ref_date === previousDate)
  }, [filteredRecords, previousDate])

  const aggregateDay = (recordsForDay: GoogleAdsRecord[]) => {
    return recordsForDay.reduce(
      (acc, record) => {
        const spend = record.cost || 0
        const leads = record.leads || 0
        const clicks = record.clicks || 0
        const impressions = record.impressions || 0
        const roas = record.roas || 0

        acc.spend += spend
        acc.leads += leads
        acc.clicks += clicks
        acc.impressions += impressions
        acc.weightedRoas += roas * spend
        acc.roasWeight += spend
        acc.items += 1
        return acc
      },
      {
        spend: 0,
        leads: 0,
        clicks: 0,
        impressions: 0,
        weightedRoas: 0,
        roasWeight: 0,
        items: 0
      }
    )
  }

  const todayTotals = useMemo(() => aggregateDay(todayRecords), [todayRecords])
  const previousTotals = useMemo(() => aggregateDay(previousRecords), [previousRecords])

  const roasToday = todayTotals.roasWeight ? todayTotals.weightedRoas / todayTotals.roasWeight : 0
  const roasYesterday = previousTotals.roasWeight ? previousTotals.weightedRoas / previousTotals.roasWeight : 0

  const spendDelta = percentChange(todayTotals.spend, previousTotals.spend)
  const leadsDelta = percentChange(todayTotals.leads, previousTotals.leads)
  const roasDelta = percentChange(roasToday, roasYesterday)
  const conversionToday = safeDivide(todayTotals.leads, todayTotals.clicks) * 100
  const conversionYesterday = safeDivide(previousTotals.leads, previousTotals.clicks) * 100
  const conversionDelta = percentChange(conversionToday, conversionYesterday)

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
      const spend = record.cost || 0
      const leads = record.leads || 0
      const clicks = record.clicks || 0
      const impressions = record.impressions || 0
      const roas = record.roas || 0

      if (existing) {
        existing.spend += spend
        existing.leads += leads
        existing.clicks += clicks
        existing.impressions += impressions
        existing.weightedRoas += roas * spend
        existing.roasWeight += spend
      } else {
        map.set(record.ref_date, {
          date: record.ref_date,
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
      .sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime())
      .slice(-30)
  }, [filteredRecords])

  const performanceSeries = useMemo(() => {
    return dailySeries.map(item => ({
      date: item.date,
      spend: item.spend,
      leads: item.leads,
      clicks: item.clicks,
      conversion: safeDivide(item.leads, item.clicks) * 100,
      roas: item.roasWeight ? item.weightedRoas / item.roasWeight : 0,
      cpl: safeDivide(item.spend, item.leads),
      cpc: safeDivide(item.spend, item.clicks)
    }))
  }, [dailySeries])

  const campaignSnapshots = useMemo<CampaignSnapshot[]>(() => {
    const source = todayRecords.length ? todayRecords : filteredRecords
    const map = new Map<string, CampaignSnapshot>()

    source.forEach(record => {
      const key = `${record.campaign_name}-${record.account_id}`
      const spend = record.cost || 0
      const leads = record.leads || 0
      const clicks = record.clicks || 0
      const impressions = record.impressions || 0
      const roas = record.roas || 0

      const entry = map.get(key)
      if (entry) {
        entry.spend += spend
        entry.leads += leads
        entry.clicks += clicks
        entry.impressions += impressions
        entry.roas += roas * spend
        entry.cpl += spend
        entry.cpc += spend
      } else {
        map.set(key, {
          key,
          campaign: record.campaign_name || 'Campanha sem nome',
          account: record.account_name || 'Conta não identificada',
          spend,
          leads,
          clicks,
          impressions,
          cpl: spend,
          cpc: spend,
          roas: roas * spend
        })
      }
    })

    const list = Array.from(map.values()).map(entry => {
      return {
        ...entry,
        cpl: safeDivide(entry.cpl, entry.leads),
        cpc: safeDivide(entry.cpc, entry.clicks),
        roas: safeDivide(entry.roas, entry.spend)
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
        Erro ao carregar dados do Google Ads.
      </div>
    )
  }

  if (!filteredRecords.length) {
    return (
      <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text">
        <motion.div className="card text-center py-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          Nenhum dado disponível para Google Ads com os filtros selecionados.
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text">
      <motion.div className="mb-6" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <motion.h1 className="text-2xl sm:text-3xl font-bold text-text mb-2 flex flex-wrap items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          Google Ads – Visão Estratégica
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
          <p className="text-xs text-text2">Variação vs dia anterior: {percentLabel(spendDelta)}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Leads gerados</p>
          <p className="text-lg sm:text-xl font-semibold text-emerald-300">{fmtNum(todayTotals.leads)}</p>
          <p className="text-xs text-text2">Variação vs dia anterior: {percentLabel(leadsDelta)}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">ROAS ponderado</p>
          <p className={`text-lg sm:text-xl font-semibold ${roasToday >= 1 ? 'text-emerald-300' : 'text-neonPink'}`}>{roasToday.toFixed(2)}x</p>
          <p className="text-xs text-text2">Variação vs dia anterior: {percentLabel(roasDelta)}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Taxa de conversão</p>
          <p className="text-lg sm:text-xl font-semibold text-blue-300">{percentLabel(conversionToday)}</p>
          <p className="text-xs text-text2">Variação vs dia anterior: {percentLabel(conversionDelta)}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Cliques</p>
          <p className="text-lg sm:text-xl font-semibold text-cyan-300">{fmtNum(todayTotals.clicks)}</p>
          <p className="text-xs text-text2">CPC médio: {fmtMoney(safeDivide(todayTotals.spend, todayTotals.clicks))}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Impressões</p>
          <p className="text-lg sm:text-xl font-semibold">{fmtNum(todayTotals.impressions)}</p>
          <p className="text-xs text-text2">CPM implícito: {fmtMoney(safeDivide(todayTotals.spend, todayTotals.impressions) * 1000)}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">CPL</p>
          <p className="text-lg sm:text-xl font-semibold">{fmtMoney(safeDivide(todayTotals.spend, todayTotals.leads))}</p>
          <p className="text-xs text-text2">Gasto médio por campanha: {fmtMoney(safeDivide(todayTotals.spend, todayRecords.length || 1))}</p>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} whileHover={{ y: -2, scale: 1.01 }}>
          <p className="text-text2 text-xs uppercase tracking-wide mb-2">Campanhas ativas</p>
          <p className="text-lg sm:text-xl font-semibold">{new Set(todayRecords.map(record => record.campaign_name)).size || filteredRecords.length}</p>
          <p className="text-xs text-text2">Contas monitoradas: {new Set(todayRecords.map(record => record.account_id)).size || availableAccounts.length}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} whileHover={{ y: -2 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-sm sm:text-lg">Trilha de investimento x resposta</h3>
            <span className="text-xs text-text2">Últimos 30 dias</span>
          </div>
          <div className="h-72">
            {performanceSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={performanceSeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tickFormatter={value => new Date(value + 'T00:00:00').getDate().toString()} fontSize={10} />
                  <YAxis yAxisId="left" fontSize={10} tickFormatter={value => fmtMoney(value as number)} width={90} />
                  <YAxis yAxisId="right" orientation="right" fontSize={10} tickFormatter={value => fmtNum(value as number)} />
                  <Tooltip
                    labelFormatter={value => new Date(value + 'T00:00:00').toLocaleDateString('pt-BR')}
                    formatter={(value, name) => {
                      if (name === 'leads') return [fmtNum(value as number), 'Leads']
                      if (name === 'clicks') return [fmtNum(value as number), 'Cliques']
                      if (name === 'conversion') return [percentLabel(value as number), 'Conversão']
                      return [fmtMoney(value as number), 'Investimento']
                    }}
                  />
                  <Legend formatter={value => {
                    if (value === 'leads') return 'Leads'
                    if (value === 'clicks') return 'Cliques'
                    if (value === 'conversion') return 'Conversão'
                    return 'Investimento'
                  }} />
                  <Area yAxisId="left" type="monotone" dataKey="spend" stroke="#2563eb" fill="#2563eb" fillOpacity={0.12} strokeWidth={2} name="Investimento" />
                  <Bar yAxisId="right" dataKey="leads" fill="#22c55e" radius={[4, 4, 0, 0]} name="Leads" />
                  <Line yAxisId="right" type="monotone" dataKey="clicks" stroke="#facc15" strokeWidth={2} dot={{ r: 2 }} name="Cliques" />
                  <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#f97316" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} name="Conversão" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text2 text-sm">
                Sem histórico suficiente para compor a análise.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} whileHover={{ y: -2 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-sm sm:text-lg">Eficiência de mídia</h3>
            <span className="text-xs text-text2">Últimos 30 dias</span>
          </div>
          <div className="h-72">
            {performanceSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={performanceSeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tickFormatter={value => new Date(value + 'T00:00:00').getDate().toString()} fontSize={10} />
                  <YAxis yAxisId="left" fontSize={10} tickFormatter={value => fmtMoney(value as number)} width={90} />
                  <YAxis yAxisId="right" orientation="right" fontSize={10} tickFormatter={value => value.toFixed(2)} />
                  <Tooltip
                    labelFormatter={value => new Date(value + 'T00:00:00').toLocaleDateString('pt-BR')}
                    formatter={(value, name) => {
                      if (name === 'roas') return [(value as number).toFixed(2) + 'x', 'ROAS']
                      if (name === 'cpl') return [fmtMoney(value as number), 'CPL']
                      if (name === 'cpc') return [fmtMoney(value as number), 'CPC']
                      return [fmtMoney(value as number), 'Investimento']
                    }}
                  />
                  <Legend formatter={value => {
                    if (value === 'roas') return 'ROAS'
                    if (value === 'cpl') return 'CPL'
                    if (value === 'cpc') return 'CPC'
                    return 'Investimento'
                  }} />
                  <Bar yAxisId="left" dataKey="spend" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Investimento" />
                  <Line yAxisId="right" type="monotone" dataKey="roas" stroke="#22c55e" strokeWidth={3} dot={{ r: 2 }} name="ROAS" />
                  <Line yAxisId="right" type="monotone" dataKey="cpl" stroke="#f97316" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} name="CPL" />
                  <Line yAxisId="right" type="monotone" dataKey="cpc" stroke="#a855f7" strokeWidth={2} dot={{ r: 2 }} name="CPC" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text2 text-sm">
                Sem dados suficientes para análise.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div className="card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} whileHover={{ y: -2 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="card-title">Campanhas protagonistas</h3>
          <span className="text-xs text-text2">{campaignSnapshots.length} campanhas avaliadas</span>
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
                <th className="text-right p-2">ROAS</th>
                <th className="text-right p-2">Impressões</th>
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
                    <td className="p-2 text-right">{campaign.roas.toFixed(2)}x</td>
                    <td className="p-2 text-right">{fmtNum(campaign.impressions)}</td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center text-text2 p-4">
                    Nenhuma campanha encontrada para os filtros aplicados.
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
