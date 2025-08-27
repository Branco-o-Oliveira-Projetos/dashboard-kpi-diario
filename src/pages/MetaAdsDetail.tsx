import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fetchDetailedData } from '../lib/api'
import { fmtNum, fmtMoney } from '../lib/format'
import { Link } from 'react-router-dom'

interface MetaAdsData {
  ref_date: string
  account_id: string
  account_name: string
  cost: number
  leads: number
  clicks: number
  cpl: number
  cpc: number
  average_total_spend: number
  taxa_de_conversao: number
  impressions: number
  reach: number
  campaign_name: string
  frequency: number
  campaign_id: string
  date_start: string
  date_stop: string
  updated_at: string
}

export default function MetaAdsDetail() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['meta-ads-detail'],
    queryFn: () => fetchDetailedData('meta_ads'),
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  })

  if (isLoading) return <div className="p-8">Carregando...</div>
  if (error) return <div className="p-8 text-red-500">Erro ao carregar dados</div>

  const records: MetaAdsData[] = data || []
  const latestData = records[0] || {}

  // Preparar dados para gráficos
  const dailyData = records.reduce((acc, item) => {
    const date = item.ref_date
    const existing = acc.find(d => d.date === date)
    
    if (existing) {
      existing.cost += item.cost
      existing.leads += item.leads
      existing.clicks += item.clicks
      existing.impressions += item.impressions
      existing.reach += item.reach
    } else {
      acc.push({
        date,
        cost: item.cost,
        leads: item.leads,
        clicks: item.clicks,
        impressions: item.impressions,
        reach: item.reach,
        cpl: item.cpl,
        cpc: item.cpc,
        frequency: item.frequency
      })
    }
    return acc
  }, [] as any[]).slice(0, 30) // Últimos 30 dias

  return (
    <div className="max-w-[1400px] mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text mb-2">Meta Ads - Detalhes</h1>
        <p className="text-text2">Análise detalhada das campanhas do Meta Ads</p>
        <Link to="/" className="text-blue-400 hover:underline mt-2 inline-block">← Voltar ao Dashboard</Link>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-2xl font-bold text-text">{fmtMoney(latestData.cost)}</div>
          <div className="text-sm text-text2">Custo Total</div>
        </motion.div>
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-2xl font-bold text-text">{fmtNum(latestData.leads)}</div>
          <div className="text-sm text-text2">Leads</div>
        </motion.div>
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-2xl font-bold text-text">{fmtNum(latestData.clicks)}</div>
          <div className="text-sm text-text2">Clicks</div>
        </motion.div>
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-2xl font-bold text-text">{fmtMoney(latestData.cpl)}</div>
          <div className="text-sm text-text2">CPL</div>
        </motion.div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Custos */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="card-title">Custos por Dia</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).getDate().toString()} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                  formatter={(value: number) => [fmtMoney(value), 'Custo']}
                />
                <Bar dataKey="cost" fill="#06004B" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de Leads */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="card-title">Leads por Dia</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).getDate().toString()} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                  formatter={(value: number) => [fmtNum(value), 'Leads']}
                />
                <Line type="monotone" dataKey="leads" stroke="#06004B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de Impressões */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="card-title">Impressões por Dia</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).getDate().toString()} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                  formatter={(value: number) => [fmtNum(value), 'Impressões']}
                />
                <Bar dataKey="impressions" fill="#4A90E2" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de Alcance */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="card-title">Alcance por Dia</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).getDate().toString()} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                  formatter={(value: number) => [fmtNum(value), 'Alcance']}
                />
                <Line type="monotone" dataKey="reach" stroke="#E74C3C" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Tabela de Campanhas */}
      <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h3 className="card-title">Campanhas Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg2">
                <th className="text-left p-2">Data</th>
                <th className="text-left p-2">Campanha</th>
                <th className="text-left p-2">Conta</th>
                <th className="text-right p-2">Custo</th>
                <th className="text-right p-2">Leads</th>
                <th className="text-right p-2">Clicks</th>
                <th className="text-right p-2">CPL</th>
                <th className="text-right p-2">CPC</th>
                <th className="text-right p-2">Frequência</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 20).map((record, idx) => (
                <tr key={idx} className="border-b border-bg2/50 hover:bg-bg2/20">
                  <td className="p-2">{new Date(record.ref_date).toLocaleDateString('pt-BR')}</td>
                  <td className="p-2 truncate max-w-[200px]" title={record.campaign_name}>
                    {record.campaign_name}
                  </td>
                  <td className="p-2 truncate max-w-[150px]" title={record.account_name}>
                    {record.account_name}
                  </td>
                  <td className="p-2 text-right">{fmtMoney(record.cost)}</td>
                  <td className="p-2 text-right">{fmtNum(record.leads)}</td>
                  <td className="p-2 text-right">{fmtNum(record.clicks)}</td>
                  <td className="p-2 text-right">{fmtMoney(record.cpl)}</td>
                  <td className="p-2 text-right">{fmtMoney(record.cpc)}</td>
                  <td className="p-2 text-right">{fmtNum(record.frequency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
