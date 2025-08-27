import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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
    <div className="flex items-center justify-center space-x-4 py-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <motion.div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
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
          <div className="text-xs text-center ml-2 mr-2 min-w-[60px]">
            {step}
          </div>
          {index < steps.length - 1 && (
            <motion.div
              className="w-8 h-0.5 bg-blue-500 mx-2"
              initial={{ scaleX: 0 }}
              animate={{ 
                scaleX: index < currentStep ? 1 : 0,
                backgroundColor: index < currentStep ? '#3B82F6' : '#374151'
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

  if (isLoading) return <div className="p-8">Carregando...</div>
  if (error) return <div className="p-8 text-red-500">Erro ao carregar dados</div>

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
    <div className="max-w-[1400px] mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text mb-2">N8N - Detalhes</h1>
        <p className="text-text2">Análise detalhada das execuções de workflows do N8N</p>
        <Link to="/" className="text-blue-400 hover:underline mt-2 inline-block">← Voltar ao Dashboard</Link>
      </div>

      {/* Animação de Fluxo de Automação */}
      <motion.div 
        className="card mb-6 relative" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
      >
        <FloatingNodes />
        <div className="relative z-10">
          <h3 className="card-title text-center mb-4">Fluxo de Automação em Tempo Real</h3>
          <AutomationFlowAnimation />
          <div className="text-center text-text2 text-sm mt-4">
            Workflows executando continuamente • {fmtNum(latestData.runs_success)} sucessos hoje
          </div>
        </div>
      </motion.div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div 
          className="card text-center" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="text-2xl font-bold text-text"
            animate={{ 
              color: ['#E8E8E8', '#3B82F6', '#E8E8E8'],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          >
            {fmtNum(latestData.flows_total)}
          </motion.div>
          <div className="text-sm text-text2">Fluxos Totais</div>
        </motion.div>
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-2xl font-bold text-green-400">{fmtNum(latestData.runs_success)}</div>
          <div className="text-sm text-text2">Execuções com Sucesso</div>
        </motion.div>
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-2xl font-bold text-red-400">{fmtNum(latestData.runs_failed)}</div>
          <div className="text-sm text-text2">Execuções Falharam</div>
        </motion.div>
        <motion.div className="card text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-2xl font-bold text-text">{fmtNum(latestData.avg_duration_sec)}s</div>
          <div className="text-sm text-text2">Duração Média</div>
        </motion.div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Fluxos Totais com animação */}
        <motion.div 
          className="card relative" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          whileHover={{ boxShadow: '0 10px 30px rgba(59, 130, 246, 0.2)' }}
        >
          <h3 className="card-title">⚡ Fluxos Totais por Dia</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).getDate().toString()} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                  formatter={(value: number) => [fmtNum(value), 'Fluxos']}
                />
                <Bar dataKey="flows_total" fill="#06004B" radius={4}>
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
          </div>
        </motion.div>

        {/* Gráfico de Sucesso vs Falhas com pulso */}
        <motion.div 
          className="card" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          whileHover={{ boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)' }}
        >
          <h3 className="card-title">🔄 Execuções: Sucesso vs Falhas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).getDate().toString()} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                  formatter={(value: number, name: string) => [
                    fmtNum(value), 
                    name === 'runs_success' ? 'Sucesso' : 'Falhas'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="runs_success" 
                  stroke="#10B981" 
                  strokeWidth={3} 
                  name="runs_success"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="runs_failed" 
                  stroke="#EF4444" 
                  strokeWidth={3} 
                  name="runs_failed"
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de Taxa de Sucesso */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="card-title">Taxa de Sucesso por Dia (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).getDate().toString()} />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa de Sucesso']}
                />
                <Line type="monotone" dataKey="success_rate" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de Duração Média */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="card-title">Duração Média por Dia (segundos)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).getDate().toString()} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                  formatter={(value: number) => [`${value.toFixed(1)}s`, 'Duração Média']}
                />
                <Bar dataKey="avg_duration_sec" fill="#F59E0B" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Tabela de Registros */}
      <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h3 className="card-title">Registros Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg2">
                <th className="text-left p-2">Data</th>
                <th className="text-left p-2">Workspace</th>
                <th className="text-right p-2">Fluxos</th>
                <th className="text-right p-2">Sucesso</th>
                <th className="text-right p-2">Falhas</th>
                <th className="text-right p-2">Total Execuções</th>
                <th className="text-right p-2">Taxa Sucesso</th>
                <th className="text-right p-2">Duração Média</th>
                <th className="text-right p-2">Última Atualização</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 20).map((record, idx) => {
                const totalRuns = record.runs_success + record.runs_failed
                const successRate = totalRuns > 0 ? (record.runs_success / totalRuns * 100) : 0
                return (
                  <tr key={idx} className="border-b border-bg2/50 hover:bg-bg2/20">
                    <td className="p-2">{new Date(record.ref_date).toLocaleDateString('pt-BR')}</td>
                    <td className="p-2 truncate max-w-[150px]" title={record.workspace_name}>
                      {record.workspace_name}
                    </td>
                    <td className="p-2 text-right">{fmtNum(record.flows_total)}</td>
                    <td className="p-2 text-right text-green-400">{fmtNum(record.runs_success)}</td>
                    <td className="p-2 text-right text-red-400">{fmtNum(record.runs_failed)}</td>
                    <td className="p-2 text-right">{fmtNum(totalRuns)}</td>
                    <td className="p-2 text-right">{successRate.toFixed(1)}%</td>
                    <td className="p-2 text-right">{record.avg_duration_sec.toFixed(1)}s</td>
                    <td className="p-2 text-right text-text2">
                      {new Date(record.updated_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
