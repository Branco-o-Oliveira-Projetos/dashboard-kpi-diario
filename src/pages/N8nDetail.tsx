import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts'
import { fetchDetailedData } from '../lib/api'
import { fmtNum } from '../lib/format'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

interface N8nData {
  ref_date: string
  workspace_id: string
  workspace_name: string
  flows_total: number
  runs_success: number
  runs_failed: number
  avg_duration_sec: number
  updated_at: string
}

// Componente de animação de workflow
function AutomationFlowAnimation() {
  const [currentStep, setCurrentStep] = useState(0)
  const steps = ['Trigger', 'Process', 'Transform', 'Execute', 'Complete']
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length)
    }, 1000)
    return () => clearInterval(interval)
  }, [steps.length])

  return (
    <div className="flex items-center justify-center space-x-2 sm:space-x-4 py-6 sm:py-8 overflow-x-auto">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center flex-shrink-0">
          <motion.div
            className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
              index <= currentStep ? 'bg-blue-500 text-white' : 'bg-bg2 text-text2'
            }`}
            animate={{
              scale: index === currentStep ? 1.2 : 1,
              boxShadow: index === currentStep ? '0 0 20px rgba(59, 130, 246, 0.5)' : '0 0 0px rgba(59, 130, 246, 0)'
            }}
            transition={{ duration: 0.3 }}
          >
            {step.slice(0, 1)}
          </motion.div>
          <div className="text-xs text-center ml-1 mr-1 sm:ml-2 sm:mr-2 min-w-[40px] sm:min-w-[60px]">
            {step}
          </div>
          {index < steps.length - 1 && (
            <motion.div
              className="w-4 sm:w-8 h-0.5 bg-blue-500 mx-1 sm:mx-2"
              initial={{ scaleX: 0 }}
              animate={{ 
                scaleX: index < currentStep ? 1 : 0,
                backgroundColor: index < currentStep ? '#A855F7' : '#1E293B'
              }}
              transition={{ duration: 0.5 }}
              style={{ transformOrigin: 'left' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// Componente de partículas flutuantes
function FloatingNodes() {
  const nodes = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {nodes.map(node => (
        <motion.div
          key={node.id}
          className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-60"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, Math.sin(node.id) * 10, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + node.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

export default function N8nDetail() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['n8n-detail'],
    queryFn: () => fetchDetailedData('n8n'),
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  })

  if (isLoading) return (
    <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text">
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
      {/* Animação de workflow loading */}
      <motion.div 
        className="card mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <motion.div 
          className="h-32 bg-bg2 rounded-lg mb-4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
      </motion.div>
      {/* KPIs loading */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.4 }}
          >
            <motion.div 
              className="h-16 bg-bg2 rounded-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          </motion.div>
        ))}
      </div>
      {/* Gráficos loading */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.8 }}
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
  if (error) return <div className="min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl text-text text-center pt-20 text-red-500">Erro ao carregar dados</div>

  const records: N8nData[] = data || []
  const latestData = records[0] || {}

  // Preparar dados para gráficos
  const dailyData = records.reduce((acc, item) => {
    const date = item.ref_date
    const existing = acc.find(d => d.date === date)
    
    if (existing) {
      existing.flows_total += item.flows_total
      existing.runs_success += item.runs_success
      existing.runs_failed += item.runs_failed
      existing.avg_duration_sec = (existing.avg_duration_sec + item.avg_duration_sec) / 2
    } else {
      acc.push({
        date,
        flows_total: item.flows_total,
        runs_success: item.runs_success,
        runs_failed: item.runs_failed,
        avg_duration_sec: item.avg_duration_sec,
        total_runs: item.runs_success + item.runs_failed,
        success_rate: item.runs_success + item.runs_failed > 0 ? 
          (item.runs_success / (item.runs_success + item.runs_failed) * 100) : 0
      })
    }
    return acc
  }, [] as any[]).slice(0, 30).reverse()

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
          className="text-2xl sm:text-3xl font-bold text-text mb-2 flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          N8N - Detalhes
        </motion.h1>
        <motion.p 
          className="text-text2 text-sm sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Análise detalhada das execuções de workflows do N8N
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

      {/* Animação de Fluxo de Automação */}
      <motion.div 
        className="card mb-4 sm:mb-6 relative" 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        whileHover={{ y: -5, scale: 1.02 }}
      >
        <FloatingNodes />
        <div className="relative z-10">
          <motion.h3 
            className="card-title text-center mb-4 text-base sm:text-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            Fluxo de Automação em Tempo Real
          </motion.h3>
          <AutomationFlowAnimation />
          <motion.div 
            className="text-center text-text2 text-xs sm:text-sm mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            Workflows executando continuamente • {fmtNum(latestData.runs_success)} sucessos hoje
          </motion.div>
        </div>
      </motion.div>

      {/* KPIs Principais */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <motion.div 
          className="card text-center" 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          whileHover={{ y: -5, scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div 
            className="text-lg sm:text-2xl font-bold text-text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, 
              color: ['#E2E8F0', '#22D3EE', '#E2E8F0'],
            }}
            transition={{ 
              duration: 0.4, 
              delay: 1.0,
              color: { 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut" 
              }
            }}
          >
            {fmtNum(latestData.flows_total)}
          </motion.div>
          <div className="text-xs sm:text-sm text-text2">Fluxos Totais</div>
        </motion.div>
        <motion.div 
          className="card text-center" 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          whileHover={{ y: -5, scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div 
            className="text-lg sm:text-2xl font-bold text-green-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.1 }}
          >
            {fmtNum(latestData.runs_success)}
          </motion.div>
          <div className="text-xs sm:text-sm text-text2">Execuções com Sucesso</div>
        </motion.div>
        <motion.div 
          className="card text-center" 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          whileHover={{ y: -5, scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div 
            className="text-lg sm:text-2xl font-bold text-red-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.2 }}
          >
            {fmtNum(latestData.runs_failed)}
          </motion.div>
          <div className="text-xs sm:text-sm text-text2">Execuções Falharam</div>
        </motion.div>
        <motion.div 
          className="card text-center" 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          whileHover={{ y: -5, scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div 
            className="text-lg sm:text-2xl font-bold text-text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.3 }}
          >
            {fmtNum(latestData.avg_duration_sec)}s
          </motion.div>
          <div className="text-xs sm:text-sm text-text2">Duração Média</div>
        </motion.div>
      </motion.div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
        {/* Gráfico de Fluxos Totais com animação */}
        <motion.div 
          className="card relative" 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(59, 130, 246, 0.2)' }}
        >
          <motion.h3 
            className="card-title text-base sm:text-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.5 }}
          >
            ⚡ Fluxos Totais por Dia
          </motion.h3>
          <motion.div 
            className="h-48 sm:h-56 lg:h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.6 }}
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
                  formatter={(value: number) => [fmtNum(value), 'Fluxos']}
                />
                <Bar dataKey="flows_total" fill="#22D3EE" radius={4}>
                  <LabelList 
                    dataKey="flows_total" 
                    position="top" 
                    formatter={(value: number) => fmtNum(value)}
                    style={{ fill: '#FFFFFF', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <motion.g
                    animate={{
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>

        {/* Gráfico de Sucesso vs Falhas com pulso */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, x: 30 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.7 }}
          whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)' }}
        >
          <motion.h3 
            className="card-title text-base sm:text-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.8 }}
          >
            🔄 Execuções: Sucesso vs Falhas
          </motion.h3>
          <motion.div 
            className="h-48 sm:h-56 lg:h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.9 }}
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
                  formatter={(value: number, name: string) => [
                    fmtNum(value), 
                    name === 'runs_success' ? 'Sucesso' : 'Falhas'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="runs_success" 
                  stroke="#06B6D4" 
                  strokeWidth={3} 
                  name="runs_success"
                  dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
                >
                  <LabelList 
                    dataKey="runs_success" 
                    position="top" 
                    formatter={(value: number) => fmtNum(value)}
                    style={{ fill: '#06B6D4', fontSize: '10px', fontWeight: 'bold' }}
                    offset={10}
                  />
                </Line>
                <Line 
                  type="monotone" 
                  dataKey="runs_failed" 
                  stroke="#EC4899" 
                  strokeWidth={3} 
                  name="runs_failed"
                  dot={{ fill: '#F87171', strokeWidth: 2, r: 4 }}
                >
                  <LabelList 
                    dataKey="runs_failed" 
                    position="top" 
                    formatter={(value: number) => fmtNum(value)}
                    style={{ fill: '#F87171', fontSize: '10px', fontWeight: 'bold' }}
                    offset={10}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>

        {/* Gráfico de Taxa de Sucesso */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, x: -30 }} 
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
            Taxa de Sucesso por Dia (%)
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
                <YAxis domain={[0, 100]} fontSize={10} />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value + 'T00:00:00')
                    return date.toLocaleDateString('pt-BR')
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa de Sucesso']}
                />
                <Line type="monotone" dataKey="success_rate" stroke="#22D3EE" strokeWidth={2}>
                  <LabelList 
                    dataKey="success_rate" 
                    position="top" 
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    style={{ fill: '#FFFFFF', fontSize: '10px', fontWeight: 'bold' }}
                    offset={10}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>

        {/* Gráfico de Duração Média */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0, x: 30 }} 
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
            Duração Média por Dia (segundos)
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
                  formatter={(value: number) => [`${value.toFixed(1)}s`, 'Duração Média']}
                />
                <Bar dataKey="avg_duration_sec" fill="#EC4899" radius={4}>
                  <LabelList 
                    dataKey="avg_duration_sec" 
                    position="top" 
                    formatter={(value: number) => `${value.toFixed(1)}s`}
                    style={{ fill: '#FFFFFF', fontSize: '10px', fontWeight: 'bold' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>
      </div>

      {/* Tabela de Registros */}
      <motion.div 
        className="card" 
        initial={{ opacity: 0, y: 50 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.6 }}
        whileHover={{ y: -2 }}
      >
        <motion.h3 
          className="card-title text-base sm:text-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 2.7 }}
        >
          Registros Recentes
        </motion.h3>
        <motion.div 
          className="overflow-x-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.8 }}
        >
          <motion.table 
            className="w-full text-xs sm:text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.9 }}
          >
            <motion.thead
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 3.0 }}
            >
              <tr className="border-b border-bg2">
                <th className="text-left p-1 sm:p-2">Data</th>
                <th className="text-left p-1 sm:p-2">Workspace</th>
                <th className="text-right p-1 sm:p-2">Fluxos</th>
                <th className="text-right p-1 sm:p-2">Sucesso</th>
                <th className="text-right p-1 sm:p-2">Falhas</th>
                <th className="text-right p-1 sm:p-2 hidden sm:table-cell">Total Exec.</th>
                <th className="text-right p-1 sm:p-2 hidden sm:table-cell">Taxa Sucesso</th>
                <th className="text-right p-1 sm:p-2 hidden sm:table-cell">Duração Média</th>
                <th className="text-right p-1 sm:p-2 hidden md:table-cell">Última Atualização</th>
              </tr>
            </motion.thead>
            <tbody>
              {records.slice(0, 20).map((record, idx) => {
                const totalRuns = record.runs_success + record.runs_failed
                const successRate = totalRuns > 0 ? (record.runs_success / totalRuns * 100) : 0
                return (
                  <motion.tr 
                    key={idx} 
                    className="border-b border-bg2/50 hover:bg-bg2/20"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.02 + 3.1 }}
                    whileHover={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      transition: { duration: 0.2 }
                    }}
                  >
                    <td className="p-1 sm:p-2 text-xs sm:text-sm">{new Date(record.ref_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="p-1 sm:p-2 truncate max-w-[100px] sm:max-w-[150px] text-xs sm:text-sm" title={record.workspace_name}>
                      {record.workspace_name}
                    </td>
                    <td className="p-1 sm:p-2 text-right text-xs sm:text-sm">{fmtNum(record.flows_total)}</td>
                    <td className="p-1 sm:p-2 text-right text-green-400 text-xs sm:text-sm">{fmtNum(record.runs_success)}</td>
                    <td className="p-1 sm:p-2 text-right text-red-400 text-xs sm:text-sm">{fmtNum(record.runs_failed)}</td>
                    <td className="p-1 sm:p-2 text-right text-xs sm:text-sm hidden sm:table-cell">{fmtNum(totalRuns)}</td>
                    <td className="p-1 sm:p-2 text-right text-xs sm:text-sm hidden sm:table-cell">{successRate.toFixed(1)}%</td>
                    <td className="p-1 sm:p-2 text-right text-xs sm:text-sm hidden sm:table-cell">{record.avg_duration_sec.toFixed(1)}s</td>
                    <td className="p-1 sm:p-2 text-right text-text2 text-xs sm:text-sm hidden md:table-cell">
                      {new Date(record.updated_at).toLocaleString('pt-BR')}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </motion.table>
        </motion.div>
      </motion.div>
    </div>
  )
}
