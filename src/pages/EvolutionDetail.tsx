import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts'
import { fetchDetailedData } from '../lib/api'
import { fmtNum } from '../lib/format'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

interface EvolutionData {
  ref_date: string
  instance_name: string
  instance_id: string
  owner: string
  api_version: string
  update_at: string
  instance_status: string
  conn_state_current: string
  messages_sent_total: number
  client_messages: number
  response_messages: number
  delivered_message: number
  read_for_client: number
  delivered_rate_pct: number
  read_rate_pct: number
  chats_active: number
  total_chats: number
  frt_seconds: number
  frt_avg_minutes: number
  chats_no_response_over_threshold: number
  response_threshold_minutes: number
}

// Componente de animação de status de conexão
function ConnectionStatusAnimation() {
  const [pulse, setPulse] = useState(false)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => !prev)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center py-8">
      <motion.div
        className="relative"
        animate={{ scale: pulse ? 1.1 : 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center">
          <div className="text-white font-bold text-lg">📱</div>
        </div>
        <motion.div
          className="absolute inset-0 bg-green-400 rounded-full opacity-30"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      <div className="ml-6">
        <div className="text-lg font-bold text-green-400">WhatsApp Evolution API</div>
        <div className="text-text2">Monitoramento em tempo real</div>
      </div>
    </div>
  )
}

// Componente de partículas de mensagens
function MessageParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 3
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.cos(particle.id) * 15, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 4 + particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

export default function EvolutionDetail() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['evolution-detail'],
    queryFn: () => fetchDetailedData('evolution'),
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  })

  if (isLoading) return <div className="p-8">Carregando...</div>
  if (error) return <div className="p-8 text-neonPink">Erro ao carregar dados</div>

  const records: EvolutionData[] = data || []

  // Preparar dados para gráficos
  const dailyData = records.reduce((acc, item) => {
    const date = item.ref_date
    const existing = acc.find(d => d.date === date)
    
    if (existing) {
      // Somar todos os valores do dia
      existing.messages_sent_total += item.messages_sent_total
      existing.client_messages += item.client_messages
      existing.response_messages += item.response_messages
      existing.delivered_message += item.delivered_message
      existing.chats_active += item.chats_active
      existing.total_chats += item.total_chats
      
      // Adicionar instância única à lista se não existir
      if (!existing.instances.includes(item.instance_name)) {
        existing.instances.push(item.instance_name)
      }
      
      // Para porcentagens e médias, acumular valores para calcular média ponderada depois
      existing.delivered_rate_sum += item.delivered_rate_pct
      existing.read_rate_sum += item.read_rate_pct
      existing.frt_avg_sum += item.frt_avg_minutes
      existing.record_count += 1
    } else {
      acc.push({
        date,
        messages_sent_total: item.messages_sent_total,
        client_messages: item.client_messages,
        response_messages: item.response_messages,
        delivered_message: item.delivered_message,
        chats_active: item.chats_active,
        total_chats: item.total_chats,
        instances: [item.instance_name], // Array com instâncias únicas
        delivered_rate_sum: item.delivered_rate_pct,
        read_rate_sum: item.read_rate_pct,
        frt_avg_sum: item.frt_avg_minutes,
        record_count: 1
      })
    }
    return acc
  }, [] as any[])
  
  // Calcular médias e preparar dados finais
  .map(day => ({
    ...day,
    delivered_rate_pct: day.delivered_rate_sum / day.record_count,
    read_rate_pct: day.read_rate_sum / day.record_count,
    frt_avg_minutes: day.frt_avg_sum / day.record_count
  }))
  .slice(0, 30)
  .reverse()

  // Calcular total de instâncias únicas
  const uniqueInstances = [...new Set(records.map(record => record.instance_name))]
  const totalInstances = uniqueInstances.length

  // Calcular somas agregadas para os KPIs
  const aggregatedKPIs = records.reduce((acc, record) => {
    acc.totalMessagesSent += record.messages_sent_total
    acc.totalClientMessages += record.client_messages
    acc.totalChatsActive += record.chats_active
    acc.deliveredRateSum += record.delivered_rate_pct
    acc.frtAvgSum += record.frt_avg_minutes
    acc.recordCount += 1
    return acc
  }, {
    totalMessagesSent: 0,
    totalClientMessages: 0,
    totalChatsActive: 0,
    deliveredRateSum: 0,
    frtAvgSum: 0,
    recordCount: 0
  })

  // Calcular médias
  const avgDeliveredRate = aggregatedKPIs.recordCount > 0 ? aggregatedKPIs.deliveredRateSum / aggregatedKPIs.recordCount : 0
  const avgFrtMinutes = aggregatedKPIs.recordCount > 0 ? aggregatedKPIs.frtAvgSum / aggregatedKPIs.recordCount : 0

  // Calcular mensagens do dia atual
  const today = new Date().toISOString().split('T')[0]
  const todayRecords = records.filter(record => record.ref_date === today)
  const todayMessagesSent = todayRecords.reduce((sum, record) => sum + record.messages_sent_total, 0)
  const todayClientMessages = todayRecords.reduce((sum, record) => sum + record.client_messages, 0)
  const todayChatsActive = todayRecords.reduce((sum, record) => sum + record.chats_active, 0)

  return (
    <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text">
      {/* Header */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1 
          className="text-2xl sm:text-3xl font-bold text-text mb-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Evolution API - Detalhes
        </motion.h1>
        <motion.p 
          className="text-text2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Monitoramento completo das instâncias WhatsApp
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

      {/* Animação de Status */}
      <motion.div 
        className="card mb-6 relative" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <MessageParticles />
        <div className="relative z-10">
          <h3 className="text-sm sm:text-lg font-semibold text-text mb-4 text-center">Status da API em Tempo Real</h3>
          <ConnectionStatusAnimation />
          <div className="text-center text-text2 text-sm mt-4">
            Instância ativa • {fmtNum(todayMessagesSent)} mensagens enviadas hoje
          </div>
        </div>
      </motion.div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <motion.div 
          className="card text-center p-2 sm:p-3 lg:p-4" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          whileHover={{ y: -2, scale: 1.02 }}
        >
          <div className="text-sm sm:text-lg lg:text-xl font-bold text-green-400">{fmtNum(todayMessagesSent)}</div>
          <div className="text-xs text-text2">Msgs Enviadas Hoje</div>
        </motion.div>
        
        <motion.div 
          className="card text-center p-2 sm:p-3 lg:p-4" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          whileHover={{ y: -2, scale: 1.02 }}
        >
          <div className="text-sm sm:text-lg lg:text-xl font-bold text-blue-400">{fmtNum(todayClientMessages)}</div>
          <div className="text-xs text-text2">Msgs Clientes Hoje</div>
        </motion.div>
        
        <motion.div 
          className="card text-center p-2 sm:p-3 lg:p-4" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          whileHover={{ y: -2, scale: 1.02 }}
        >
          <div className="text-sm sm:text-lg lg:text-xl font-bold text-purple-400">{fmtNum(todayChatsActive)}</div>
          <div className="text-xs text-text2">Chats Ativos Hoje</div>
        </motion.div>
        
        <motion.div 
          className="card text-center p-2 sm:p-3 lg:p-4" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          whileHover={{ y: -2, scale: 1.02 }}
        >
          <div className="text-sm sm:text-lg lg:text-xl font-bold text-purple-400">{fmtNum(totalInstances)}</div>
          <div className="text-xs text-text2">Total Instâncias</div>
        </motion.div>
        
        <motion.div 
          className="card text-center p-2 sm:p-3 lg:p-4" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          whileHover={{ y: -2, scale: 1.02 }}
        >
          <div className="text-sm sm:text-lg lg:text-xl font-bold text-text">{avgDeliveredRate.toFixed(1)}%</div>
          <div className="text-xs text-text2">Taxa Entrega</div>
        </motion.div>
        
        <motion.div 
          className="card text-center p-2 sm:p-3 lg:p-4" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          whileHover={{ y: -2, scale: 1.02 }}
        >
          <div className="text-sm sm:text-lg lg:text-xl font-bold text-text">{avgFrtMinutes.toFixed(1)} min</div>
          <div className="text-xs text-text2">Tempo Médio Resposta</div>
        </motion.div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6">
        {/* Gráfico de Mensagens Enviadas */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          whileHover={{ y: -2 }}
        >
          <h3 className="text-sm sm:text-lg font-semibold text-text mb-3 sm:mb-4">📤 Mensagens Enviadas por Dia</h3>
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
                  formatter={(value: number) => [fmtNum(value), 'Mensagens']}
                />
                <Bar dataKey="messages_sent_total" fill="#22D3EE" radius={4}>
                  <LabelList 
                    dataKey="messages_sent_total" 
                    position="top" 
                    formatter={(value: number) => fmtNum(value)}
                    style={{ fill: '#FFFFFF', fontSize: '10px', fontWeight: 'bold' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de Chats Ativos */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, x: 30 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          whileHover={{ y: -2 }}
        >
          <h3 className="text-sm sm:text-lg font-semibold text-text mb-3 sm:mb-4">💬 Chats Ativos por Dia</h3>
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
                  formatter={(value: number) => [fmtNum(value), 'Chats']}
                />
                <Line type="monotone" dataKey="chats_active" stroke="#22D3EE" strokeWidth={2}>
                  <LabelList 
                    dataKey="chats_active" 
                    position="top" 
                    formatter={(value: number) => fmtNum(value)}
                    style={{ fill: '#FFFFFF', fontSize: '10px', fontWeight: 'bold' }}
                    offset={10}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de Taxa de Entrega */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          whileHover={{ y: -2 }}
        >
          <h3 className="text-sm sm:text-lg font-semibold text-text mb-3 sm:mb-4">📊 Taxa de Entrega (%)</h3>
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
                <YAxis domain={[0, 100]} fontSize={10} />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value + 'T00:00:00')
                    return date.toLocaleDateString('pt-BR')
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa de Entrega']}
                />
                <Line type="monotone" dataKey="delivered_rate_pct" stroke="#06B6D4" strokeWidth={2}>
                  <LabelList 
                    dataKey="delivered_rate_pct" 
                    position="top" 
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    style={{ fill: '#FFFFFF', fontSize: '10px', fontWeight: 'bold' }}
                    offset={10}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de Tempo de Resposta */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          whileHover={{ y: -2 }}
        >
          <h3 className="text-sm sm:text-lg font-semibold text-text mb-3 sm:mb-4">⏱️ Tempo de Resposta (min)</h3>
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
                  formatter={(value: number) => [`${value.toFixed(1)}m`, 'Tempo Médio']}
                />
                <Bar dataKey="frt_avg_minutes" fill="#22D3EE" radius={4}>
                  <LabelList 
                    dataKey="frt_avg_minutes" 
                    position="top" 
                    formatter={(value: number) => `${value.toFixed(1)}m`}
                    style={{ fill: '#FFFFFF', fontSize: '10px', fontWeight: 'bold' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Tabela de Registros */}
      <motion.div 
        className="card" 
        initial={{ opacity: 0, y: 50 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.6 }}
        whileHover={{ y: -2 }}
      >
        <h3 className="text-sm sm:text-lg font-semibold text-text mb-3 sm:mb-4">Registros Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg2">
                <th className="text-left p-2">Data</th>
                <th className="text-left p-2">Instância</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">Msgs Enviadas</th>
                <th className="text-right p-2">Msgs Clientes</th>
                <th className="text-right p-2">Chats Ativos</th>
                <th className="text-right p-2">Taxa Entrega</th>
                <th className="text-right p-2">Taxa Leitura</th>
                <th className="text-right p-2">Atualização</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 20).map((record, idx) => (
                <motion.tr 
                  key={idx} 
                  className="border-b border-bg2/50 hover:bg-bg2/20"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 + 1.7 }}
                  whileHover={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    transition: { duration: 0.2 }
                  }}
                >
                  <td className="p-2">{new Date(record.ref_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="p-2 truncate max-w-[120px]" title={record.instance_name}>
                    {record.instance_name}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        record.conn_state_current === 'open'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-[#F87171]/20 text-[#F87171]'
                      }`}
                    >
                      {record.conn_state_current}
                    </span>
                  </td>
                  <td className="p-2 text-right text-green-400">{fmtNum(record.messages_sent_total)}</td>
                  <td className="p-2 text-right text-blue-400">{fmtNum(record.client_messages)}</td>
                  <td className="p-2 text-right">{fmtNum(record.chats_active)}</td>
                  <td className="p-2 text-right">{record.delivered_rate_pct?.toFixed(1)}%</td>
                  <td className="p-2 text-right">{record.read_rate_pct?.toFixed(1)}%</td>
                  <td className="p-2 text-right text-text2">
                    {new Date(record.update_at).toLocaleString('pt-BR')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
