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

  if (isLoading) return (
    <div className="min-h-screen w-full mx-auto px-4 py-6 max-w-full">
      <div className="mb-6">
        <motion.div 
          className="h-8 bg-bg2 rounded-lg mb-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div 
          className="h-4 bg-bg2 rounded-lg w-1/2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <motion.div 
              className="h-16 bg-bg2 rounded-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            />
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.4 }}
          >
            <motion.div 
              className="h-64 bg-bg2 rounded-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
  if (error) return <div className="min-h-screen w-full mx-auto px-4 py-6 max-w-full text-center pt-20 text-red-500">Erro ao carregar dados</div>

  const records: MetaAdsData[] = data || []
  
  // Filtrar dados por campanha se selecionada
  const filteredRecords = selectedCampaign 
    ? records.filter(record => record.campaign_name === selectedCampaign)
    : records

  // Obter data mais recente nos dados
  const mostRecentDate = filteredRecords.reduce((latest, record) => {
    const recordDate = new Date(record.ref_date + 'T00:00:00')
    const latestDate = new Date(latest + 'T00:00:00')
    return recordDate > latestDate ? record.ref_date : latest
  }, filteredRecords[0]?.ref_date || '')

  // Filtra os registros do dia mais recente
  const todayRecords = filteredRecords.filter(r => r.ref_date === mostRecentDate)

  const kpiData = todayRecords.reduce((acc, r) => {
    acc.totalCost        += r.cost        ?? 0
    acc.totalLeads       += r.leads       ?? 0
    acc.totalClicks      += r.clicks      ?? 0
    acc.totalImpressions += r.impressions ?? 0
    acc.totalReach       += r.reach       ?? 0

    // Somatórios para médias simples
    if (typeof r.cpl === 'number') { acc.sumCPL += r.cpl; acc.countCPL += 1 }
    if (typeof r.cpc === 'number') { acc.sumCPC += r.cpc; acc.countCPC += 1 }

    acc.records += 1
    return acc
  }, {
    totalCost: 0,
    totalLeads: 0,
    totalClicks: 0,
    totalImpressions: 0,
    totalReach: 0,
    sumCPL: 0,  countCPL: 0,
    sumCPC: 0,  countCPC: 0,
    records: 0
  })

  // MÉDIAS SIMPLES por registro (o que você pediu)
  const avgCPL = kpiData.countCPL > 0 ? kpiData.sumCPL / kpiData.countCPL : 0
  const avgCPC = kpiData.countCPC > 0 ? kpiData.sumCPC / kpiData.countCPC : 0
  
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
    <div className="min-h-screen w-full mx-auto px-4 py-6 max-w-full">
      {/* Header */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1 
          className="text-2xl sm:text-3xl font-bold text-text mb-2 flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Meta Ads - Detalhes
        </motion.h1>
        <motion.p 
          className="text-text2 text-sm sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Análise detalhada das campanhas do Meta Ads
        </motion.p>
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-3 sm:gap-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link to="/" className="text-blue-400 hover:underline group">
            <motion.span
              className="inline-flex items-center"
              whileHover={{ x: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              ← Voltar ao Dashboard
            </motion.span>
          </Link>
          
          {/* Filtro por Campanha */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label htmlFor="campaign-filter" className="text-xs sm:text-sm text-text2">
              Filtrar por campanha:
            </label>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                id="campaign-filter"
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="bg-bg2 text-text border border-bg2 rounded px-2 sm:px-3 py-1 text-xs sm:text-sm focus:outline-none focus:border-blue-400 w-full sm:w-auto min-w-[200px]"
              >
                <option value="">Todas as campanhas</option>
                {uniqueCampaigns.map((campaign, index) => (
                  <option key={index} value={campaign}>
                    {campaign}
                  </option>
                ))}
              </select>
              {selectedCampaign && (
                <motion.button
                  onClick={() => setSelectedCampaign('')}
                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs sm:text-sm transition-colors flex-shrink-0"
                  title="Limpar filtro"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ✕
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
        
        {selectedCampaign && (
          <motion.div 
            className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-blue-400 text-xs sm:text-sm">📊 Exibindo dados para:</span>
              <span className="text-text font-medium text-xs sm:text-sm break-all">{selectedCampaign}</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* KPIs Principais */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <motion.div 
          className="card text-center" 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          whileHover={{ y: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div 
            className="text-lg sm:text-2xl font-bold text-text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            {fmtMoney(kpiData.totalCost)}
          </motion.div>
          <div className="text-xs sm:text-sm text-text2">Custo do Dia</div>
        </motion.div>
        <motion.div 
          className="card text-center" 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          whileHover={{ y: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div 
            className="text-lg sm:text-2xl font-bold text-text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            {fmtNum(kpiData.totalLeads)}
          </motion.div>
          <div className="text-xs sm:text-sm text-text2">Leads do Dia</div>
        </motion.div>
        <motion.div 
          className="card text-center" 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          whileHover={{ y: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div 
            className="text-lg sm:text-2xl font-bold text-text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.0 }}
          >
            {fmtNum(kpiData.totalClicks)}
          </motion.div>
          <div className="text-xs sm:text-sm text-text2">Clicks do Dia</div>
        </motion.div>
        <motion.div 
          className="card text-center" 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          whileHover={{ y: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div 
            className="text-lg sm:text-2xl font-bold text-text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.1 }}
          >
            {fmtMoney(avgCPL)}
          </motion.div>
          <div className="text-xs sm:text-sm text-text2">CPL do Dia</div>
        </motion.div>
      </motion.div>

      {/* KPIs Secundários */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <motion.div 
          className="card text-center" 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.3 }}
          whileHover={{ y: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div 
            className="text-lg sm:text-2xl font-bold text-text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.4 }}
          >
            {fmtMoney(avgCPC)}
          </motion.div>
          <div className="text-xs sm:text-sm text-text2">CPC do Dia</div>
        </motion.div>
        <motion.div 
          className="card text-center" 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.4 }}
          whileHover={{ y: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div 
            className="text-lg sm:text-2xl font-bold text-text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.5 }}
          >
            {fmtNum(kpiData.totalImpressions)}
          </motion.div>
          <div className="text-xs sm:text-sm text-text2">Impressões do Dia</div>
        </motion.div>
        <motion.div 
          className="card text-center" 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
          whileHover={{ y: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div 
            className="text-lg sm:text-2xl font-bold text-text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.6 }}
          >
            {fmtNum(kpiData.totalReach)}
          </motion.div>
          <div className="text-xs sm:text-sm text-text2">Alcance do Dia</div>
        </motion.div>
      </motion.div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
        {/* Gráfico de Custos */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.7 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <motion.h3 
            className="card-title text-base sm:text-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.8 }}
          >
            Custos por Dia
          </motion.h3>
          <motion.div 
            className="h-48 sm:h-56 lg:h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.9 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value + 'T00:00:00')
                    return date.getDate().toString()
                  }}
                  fontSize={10}
                />
                <YAxis fontSize={10} />
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
                        style={{ fill: '#06004B', fontSize: '10px', fontWeight: 'bold' }}
                    />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>

        {/* Gráfico de Leads */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, x: 30 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 2.0 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <motion.h3 
            className="card-title text-base sm:text-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 2.1 }}
          >
            Leads por Dia
          </motion.h3>
          <motion.div 
            className="h-48 sm:h-56 lg:h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 2.2 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value + 'T00:00:00')
                    return date.getDate().toString()
                  }}
                  fontSize={10}
                />
                <YAxis fontSize={10} />
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
          </motion.div>
        </motion.div>

        {/* Gráfico de Impressões */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 2.3 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <motion.h3 
            className="card-title text-base sm:text-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 2.4 }}
          >
            Impressões por Dia
          </motion.h3>
          <motion.div 
            className="h-48 sm:h-56 lg:h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 2.5 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value + 'T00:00:00')
                    return date.getDate().toString()
                  }}
                  fontSize={10}
                />
                <YAxis fontSize={10} />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value + 'T00:00:00')
                    return date.toLocaleDateString('pt-BR')
                  }}
                  formatter={(value: number) => [fmtNum(value), 'Impressões']}
                />
                <Bar dataKey="impressions" fill="#06004B" radius={4}>
                  <LabelList 
                    dataKey="impressions" 
                    position="top" 
                    formatter={(value: number) => fmtNum(value)}
                    style={{ fill: '#06004B', fontSize: '10px', fontWeight: 'bold' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>

        {/* Gráfico de Alcance */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, x: 30 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 2.6 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <motion.h3 
            className="card-title text-base sm:text-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 2.7 }}
          >
            Alcance por Dia
          </motion.h3>
          <motion.div 
            className="h-48 sm:h-56 lg:h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 2.8 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value + 'T00:00:00')
                    return date.getDate().toString()
                  }}
                  fontSize={10}
                />
                <YAxis fontSize={10} />
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
          </motion.div>
        </motion.div>
      </div>

      {/* Tabela de Campanhas */}
      <motion.div 
        className="card" 
        initial={{ opacity: 0, y: 50 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.9 }}
        whileHover={{ y: -2 }}
      >
        <motion.h3 
          className="card-title text-base sm:text-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 3.0 }}
        >
          {selectedCampaign 
            ? `Registros da Campanha: ${selectedCampaign}`
            : 'Campanhas Recentes'
          }
        </motion.h3>
        <motion.div 
          className="overflow-x-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 3.1 }}
        >
          <motion.table 
            className="w-full text-xs sm:text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 3.2 }}
          >
            <motion.thead
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 3.3 }}
            >
              <tr className="border-b border-bg2">
                <th className="text-left p-1 sm:p-2">Data</th>
                <th className="text-left p-1 sm:p-2">Campanha</th>
                <th className="text-left p-1 sm:p-2">Conta</th>
                <th className="text-right p-1 sm:p-2">Custo</th>
                <th className="text-right p-1 sm:p-2">Leads</th>
                <th className="text-right p-1 sm:p-2">Clicks</th>
                <th className="text-right p-1 sm:p-2">CPL</th>
                <th className="text-right p-1 sm:p-2">CPC</th>
                <th className="text-right p-1 sm:p-2 hidden sm:table-cell">Frequência</th>
              </tr>
            </motion.thead>
            <tbody>
              {filteredRecords.slice(0, 20).map((record, idx) => (
                <motion.tr 
                  key={idx} 
                  className="border-b border-bg2/50 hover:bg-bg2/20"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.02 + 3.4 }}
                  whileHover={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    transition: { duration: 0.2 }
                  }}
                >
                  <td className="p-1 sm:p-2 text-xs sm:text-sm">
                    {new Date(record.ref_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-1 sm:p-2 truncate max-w-[120px] sm:max-w-[200px] text-xs sm:text-sm" title={record.campaign_name}>
                    {record.campaign_name}
                  </td>
                  <td className="p-1 sm:p-2 truncate max-w-[100px] sm:max-w-[150px] text-xs sm:text-sm" title={record.account_name}>
                    {record.account_name}
                  </td>
                  <td className="p-1 sm:p-2 text-right text-xs sm:text-sm">{fmtMoney(record.cost)}</td>
                  <td className="p-1 sm:p-2 text-right text-xs sm:text-sm">{fmtNum(record.leads)}</td>
                  <td className="p-1 sm:p-2 text-right text-xs sm:text-sm">{fmtNum(record.clicks)}</td>
                  <td className="p-1 sm:p-2 text-right text-xs sm:text-sm">{fmtMoney(record.cpl)}</td>
                  <td className="p-1 sm:p-2 text-right text-xs sm:text-sm">{fmtMoney(record.cpc)}</td>
                  <td className="p-1 sm:p-2 text-right text-xs sm:text-sm hidden sm:table-cell">{fmtNum(record.frequency)}</td>
                </motion.tr>
              ))}
            </tbody>
          </motion.table>
        </motion.div>
      </motion.div>
    </div>
  )
}
