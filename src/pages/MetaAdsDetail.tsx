import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts'
import { fetchDetailedData } from '../lib/api'
import { fmtNum, fmtMoney } from '../lib/format'
import { Link } from 'react-router-dom'
import { useState } from 'react'

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
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['meta-ads-detail'],
    queryFn: () => fetchDetailedData('meta_ads'),
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  })

  if (isLoading) return <div className="p-8">Carregando...</div>
  if (error) return <div className="p-8 text-red-500">Erro ao carregar dados</div>

  const records: MetaAdsData[] = data || []
  
  // Filtrar dados por campanha se selecionada
  const filteredRecords = selectedCampaign 
    ? records.filter(record => record.campaign_name === selectedCampaign)
    : records
  
  // Calcular KPIs consolidados
  const kpiData = filteredRecords.reduce((acc, record) => {
    acc.totalCost += record.cost || 0
    acc.totalLeads += record.leads || 0
    acc.totalClicks += record.clicks || 0
    acc.totalImpressions += record.impressions || 0
    acc.totalReach += record.reach || 0
    acc.records += 1
    return acc
  }, {
    totalCost: 0,
    totalLeads: 0,
    totalClicks: 0,
    totalImpressions: 0,
    totalReach: 0,
    records: 0
  })
  
  // CPL e CPC médios
  const avgCPL = kpiData.totalLeads > 0 ? kpiData.totalCost / kpiData.totalLeads : 0
  const avgCPC = kpiData.totalClicks > 0 ? kpiData.totalCost / kpiData.totalClicks : 0
  
  // Obter lista única de campanhas para o dropdown
  const uniqueCampaigns = [...new Set(records.map(record => record.campaign_name))].sort()

  // Preparar dados para gráficos
  const dailyData = filteredRecords.reduce((acc, item) => {
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
  }, [] as any[])
    .slice(0, 30) // Últimos 30 dias
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Ordem crescente

  return (
    <div className="max-w-[1400px] mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text mb-2">Meta Ads - Detalhes</h1>
        <p className="text-text2">Análise detalhada das campanhas do Meta Ads</p>
        <div className="flex items-center justify-between mt-4">
          <Link to="/" className="text-blue-400 hover:underline">← Voltar ao Dashboard</Link>
          
          {/* Filtro por Campanha */}
          <div className="flex items-center gap-2">
            <label htmlFor="campaign-filter" className="text-sm text-text2">
              Filtrar por campanha:
            </label>
            <select
              id="campaign-filter"
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="bg-bg2 text-text border border-bg2 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="">Todas as campanhas</option>
              {uniqueCampaigns.map((campaign, index) => (
                <option key={index} value={campaign}>
                  {campaign}
                </option>
              ))}
            </select>
            {selectedCampaign && (
              <button
                onClick={() => setSelectedCampaign('')}
                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors"
                title="Limpar filtro"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        {selectedCampaign && (
          <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-sm">
            <span className="text-blue-400">📊 Exibindo dados para:</span>
            <span className="text-text font-medium ml-2">{selectedCampaign}</span>
          </div>
        )}
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-2xl font-bold text-text">{fmtMoney(kpiData.totalCost)}</div>
          <div className="text-sm text-text2">Custo Total</div>
        </motion.div>
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-2xl font-bold text-text">{fmtNum(kpiData.totalLeads)}</div>
          <div className="text-sm text-text2">Total de Leads</div>
        </motion.div>
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-2xl font-bold text-text">{fmtNum(kpiData.totalClicks)}</div>
          <div className="text-sm text-text2">Total de Clicks</div>
        </motion.div>
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-2xl font-bold text-text">{fmtMoney(avgCPL)}</div>
          <div className="text-sm text-text2">CPL Médio</div>
        </motion.div>
      </div>

      {/* KPIs Secundários */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-2xl font-bold text-text">{fmtMoney(avgCPC)}</div>
          <div className="text-sm text-text2">CPC Médio</div>
        </motion.div>
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-2xl font-bold text-text">{fmtNum(kpiData.totalImpressions)}</div>
          <div className="text-sm text-text2">Total de Impressões</div>
        </motion.div>
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-2xl font-bold text-text">{fmtNum(kpiData.totalReach)}</div>
          <div className="text-sm text-text2">Alcance Total</div>
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
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value + 'T00:00:00')
                    return date.getDate().toString()
                  }} 
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value + 'T00:00:00')
                    return date.toLocaleDateString('pt-BR')
                  }}
                  formatter={(value: number) => [fmtMoney(value), 'Custo']}
                />
                <Bar dataKey="cost" fill="#06004B" radius={4}>
                  <LabelList 
                    dataKey="cost" 
                    position="top" 
                    formatter={(value: number) => fmtMoney(value)}
                    style={{ fill: '#E8E8E8', fontSize: '10px', fontWeight: 'bold' }}
                  />
                </Bar>
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
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value + 'T00:00:00')
                    return date.getDate().toString()
                  }} 
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value + 'T00:00:00')
                    return date.toLocaleDateString('pt-BR')
                  }}
                  formatter={(value: number) => [fmtNum(value), 'Leads']}
                />
                <Line type="monotone" dataKey="leads" stroke="#06004B" strokeWidth={2}>
                  <LabelList 
                    dataKey="leads" 
                    position="top" 
                    formatter={(value: number) => fmtNum(value)}
                    style={{ fill: '#06004B', fontSize: '10px', fontWeight: 'bold' }}
                    offset={10}
                  />
                </Line>
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
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value + 'T00:00:00')
                    return date.getDate().toString()
                  }} 
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value + 'T00:00:00')
                    return date.toLocaleDateString('pt-BR')
                  }}
                  formatter={(value: number) => [fmtNum(value), 'Impressões']}
                />
                <Bar dataKey="impressions" fill="#4A90E2" radius={4}>
                  <LabelList 
                    dataKey="impressions" 
                    position="top" 
                    formatter={(value: number) => fmtNum(value)}
                    style={{ fill: '#E8E8E8', fontSize: '10px', fontWeight: 'bold' }}
                  />
                </Bar>
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
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value + 'T00:00:00')
                    return date.getDate().toString()
                  }} 
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value + 'T00:00:00')
                    return date.toLocaleDateString('pt-BR')
                  }}
                  formatter={(value: number) => [fmtNum(value), 'Alcance']}
                />
                <Line type="monotone" dataKey="reach" stroke="#E74C3C" strokeWidth={2}>
                  <LabelList 
                    dataKey="reach" 
                    position="top" 
                    formatter={(value: number) => fmtNum(value)}
                    style={{ fill: '#E74C3C', fontSize: '10px', fontWeight: 'bold' }}
                    offset={10}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Tabela de Campanhas */}
      <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h3 className="card-title">
          {selectedCampaign 
            ? `Registros da Campanha: ${selectedCampaign}`
            : 'Campanhas Recentes'
          }
        </h3>
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
              {filteredRecords.slice(0, 20).map((record, idx) => (
                <tr key={idx} className="border-b border-bg2/50 hover:bg-bg2/20">
                  <td className="p-2">{new Date(record.ref_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
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
