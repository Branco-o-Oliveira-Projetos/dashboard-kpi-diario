import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts'
import { fetchDetailedData } from '../lib/api'
import { fmtNum, fmtMoney } from '../lib/format'
import { Link } from 'react-router-dom'

interface GoogleAdsData {
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
  gasto_medio: number
  updated_at: string
}

export default function GoogleAdsDetail() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['google-ads-detail'],
    queryFn: () => fetchDetailedData('google_ads'),
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  })

  if (isLoading) return <div className="p-8">Carregando...</div>
  if (error) return <div className="p-8 text-red-500">Erro ao carregar dados</div>

  const records: GoogleAdsData[] = data || []
  const latestData = records[0] || {}

  // Preparar dados para gráficos
  const dailyData = records.reduce((acc, item) => {
    const date = item.ref_date
    const existing = acc.find(d => d.date === date)
    
    if (existing) {
      existing.cost += item.cost
      existing.leads += item.leads
      existing.clicks += item.clicks
    } else {
      acc.push({
        date,
        cost: item.cost,
        leads: item.leads,
        clicks: item.clicks,
        cpl: item.cpl,
        cpc: item.cpc,
        roas: item.roas,
        gasto_medio: item.gasto_medio
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
          Google Ads - Detalhes
        </motion.h1>
        <motion.p 
          className="text-text2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Análise detalhada das campanhas do Google Ads
        </motion.p>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link to="/" className="text-blue-400 hover:underline mt-2 inline-block group">
            <motion.span
              className="inline-flex items-center"
              whileHover={{ x: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              ← Voltar ao Dashboard
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <motion.div 
          className="card text-center p-2 sm:p-3 lg:p-4" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          whileHover={{ y: -2, scale: 1.02 }}
        >
          <div className="text-sm sm:text-lg lg:text-xl font-bold text-text">{fmtMoney(latestData.cost)}</div>
          <div className="text-xs text-text2">Custo</div>
        </motion.div>
        <motion.div 
          className="card text-center p-2 sm:p-3 lg:p-4" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ y: -2, scale: 1.02 }}
        >
          <div className="text-sm sm:text-lg lg:text-xl font-bold text-text">{fmtNum(latestData.leads)}</div>
          <div className="text-xs text-text2">Leads</div>
        </motion.div>
        <motion.div 
          className="card text-center p-2 sm:p-3 lg:p-4" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ y: -2, scale: 1.02 }}
        >
          <div className="text-sm sm:text-lg lg:text-xl font-bold text-text">{fmtNum(latestData.clicks)}</div>
          <div className="text-xs text-text2">Clicks</div>
        </motion.div>
        <motion.div 
          className="card text-center p-2 sm:p-3 lg:p-4" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ y: -2, scale: 1.02 }}
        >
          <div className="text-sm sm:text-lg lg:text-xl font-bold text-text">{fmtMoney(latestData.cpl)}</div>
          <div className="text-xs text-text2">CPL</div>
        </motion.div>
        <motion.div 
          className="card text-center p-2 sm:p-3 lg:p-4" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          whileHover={{ y: -2, scale: 1.02 }}
        >
          <div className="text-sm sm:text-lg lg:text-xl font-bold text-text">{fmtNum(latestData.roas)}</div>
          <div className="text-xs text-text2">ROAS</div>
        </motion.div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6">
        {/* Gráfico de Custos */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          whileHover={{ y: -2 }}
        >
          <h3 className="text-sm sm:text-lg font-semibold text-text mb-3 sm:mb-4">Custos por Dia</h3>
          <div className="h-40 sm:h-48 lg:h-56">
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
          </div>
        </motion.div>

        {/* Gráfico de Leads */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, x: 30 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          whileHover={{ y: -2 }}
        >
          <h3 className="text-sm sm:text-lg font-semibold text-text mb-3 sm:mb-4">Leads por Dia</h3>
          <div className="h-40 sm:h-48 lg:h-56">
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
                <Line type="monotone" dataKey="leads" stroke="#4285F4" strokeWidth={2}>
                  <LabelList 
                    dataKey="leads" 
                    position="top" 
                    formatter={(value: number) => fmtNum(value)}
                    style={{ fill: '#4285F4', fontSize: '10px', fontWeight: 'bold' }}
                    offset={10}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de Clicks */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          whileHover={{ y: -2 }}
        >
          <h3 className="text-sm sm:text-lg font-semibold text-text mb-3 sm:mb-4">Clicks por Dia</h3>
          <div className="h-40 sm:h-48 lg:h-56">
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
                  formatter={(value: number) => [fmtNum(value), 'Clicks']}
                />
                <Bar dataKey="clicks" fill="#06004B" radius={4}>
                  <LabelList 
                    dataKey="clicks" 
                    position="top" 
                    formatter={(value: number) => fmtNum(value)}
                    style={{ fill: '#06004B', fontSize: '10px', fontWeight: 'bold' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de ROAS */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          whileHover={{ y: -2 }}
        >
          <h3 className="text-sm sm:text-lg font-semibold text-text mb-3 sm:mb-4">ROAS por Dia</h3>
          <div className="h-40 sm:h-48 lg:h-56">
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
                  formatter={(value: number) => [fmtNum(value), 'ROAS']}
                />
                <Line type="monotone" dataKey="roas" stroke="#EA4335" strokeWidth={2}>
                  <LabelList 
                    dataKey="roas" 
                    position="top" 
                    formatter={(value: number) => fmtNum(value)}
                    style={{ fill: '#EA4335', fontSize: '10px', fontWeight: 'bold' }}
                    offset={10}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Tabela de Campanhas */}
      <motion.div 
        className="card" 
        initial={{ opacity: 0, y: 50 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        whileHover={{ y: -2 }}
      >
        <h3 className="text-sm sm:text-lg font-semibold text-text mb-3 sm:mb-4">Todas as Contas e Campanhas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg2">
                <th className="text-left p-2">Data</th>
                <th className="text-left p-2">Conta</th>
                <th className="text-left p-2">Campanha</th>
                <th className="text-right p-2">Custo</th>
                <th className="text-right p-2">Leads</th>
                <th className="text-right p-2">Clicks</th>
                <th className="text-right p-2">CPL</th>
                <th className="text-right p-2">CPC</th>
                <th className="text-right p-2">ROAS</th>
                <th className="text-right p-2">Gasto Médio</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 20).map((record, idx) => (
                <motion.tr 
                  key={idx} 
                  className="border-b border-bg2/50 hover:bg-bg2/20"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 + 1.1 }}
                  whileHover={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    transition: { duration: 0.2 }
                  }}
                >
                  <td className="p-2">{new Date(record.ref_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="p-2 truncate max-w-[150px]" title={record.account_name}>
                    {record.account_name}
                  </td>
                  <td className="p-2 truncate max-w-[200px]" title={record.campaign_name || 'N/A'}>
                    {record.campaign_name || 'N/A'}
                  </td>
                  <td className="p-2 text-right">{fmtMoney(record.cost)}</td>
                  <td className="p-2 text-right">{fmtNum(record.leads)}</td>
                  <td className="p-2 text-right">{fmtNum(record.clicks)}</td>
                  <td className="p-2 text-right">{fmtMoney(record.cpl)}</td>
                  <td className="p-2 text-right">{fmtMoney(record.cpc)}</td>
                  <td className="p-2 text-right">{fmtNum(record.roas)}</td>
                  <td className="p-2 text-right">{fmtMoney(record.gasto_medio)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
