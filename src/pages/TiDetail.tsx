import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bar, BarChart, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts'
import { fetchDetailedData } from '../lib/api'
import { fmtNum } from '../lib/format'
import { Link } from 'react-router-dom'

interface TiData {
  ref_date: string
  avg_min: string
  avg_hor: string
  abertos: number
  andamento: number
  resolvidos_hoje: number
  updated_at: string
  abertos_urgente: number
  abertos_alta: number
  abertos_média: number
  abertos_baixa: number
  resolvidos_urgente: number
  resolvidos_alta: number
  resolvidos_média: number
  resolvidos_baixa: number
}

// Componente de animação para chamados
function TicketAnimation() {
  return (
    <div className="flex items-center justify-center py-8">
      <motion.div
        className="relative"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-24 h-24 bg-blue-500 rounded-lg flex items-center justify-center">
          <div className="text-white font-bold text-2xl">🎫</div>
        </div>
      </motion.div>
      <div className="ml-6">
        <div className="text-lg font-bold text-blue-400">Sistema de Chamados T.I</div>
        <div className="text-text2">Monitoramento de tickets e SLA</div>
      </div>
    </div>
  )
}

export default function TiDetail() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ti-detail'],
    queryFn: () => fetchDetailedData('ti'),
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  })

  if (isLoading) return <div className="p-8">Carregando...</div>
  if (error) return <div className="p-8 text-red-500">Erro ao carregar dados</div>

  const records: TiData[] = data || []

  // Preparar dados para gráficos diários
  const dailyData = records.reduce((acc, item) => {
    const date = item.ref_date
    const existing = acc.find(d => d.date === date)

    if (existing) {
      existing.abertos += item.abertos
      existing.andamento += item.andamento
      existing.resolvidos_hoje += item.resolvidos_hoje
      existing.abertos_urgente += item.abertos_urgente
      existing.abertos_alta += item.abertos_alta
      existing.abertos_média += item.abertos_média
      existing.abertos_baixa += item.abertos_baixa
      existing.resolvidos_urgente += item.resolvidos_urgente
      existing.resolvidos_alta += item.resolvidos_alta
      existing.resolvidos_média += item.resolvidos_média
      existing.resolvidos_baixa += item.resolvidos_baixa
    } else {
      acc.push({
        date,
        abertos: item.abertos,
        andamento: item.andamento,
        resolvidos_hoje: item.resolvidos_hoje,
        abertos_urgente: item.abertos_urgente,
        abertos_alta: item.abertos_alta,
        abertos_média: item.abertos_média,
        abertos_baixa: item.abertos_baixa,
        resolvidos_urgente: item.resolvidos_urgente,
        resolvidos_alta: item.resolvidos_alta,
        resolvidos_média: item.resolvidos_média,
        resolvidos_baixa: item.resolvidos_baixa,
      })
    }
    return acc
  }, [] as any[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Dados para gráfico de pizza de prioridades (último dia)
  const lastRecord = records[records.length - 1]
  const priorityData = lastRecord ? [
    { name: 'Urgente', value: lastRecord.abertos_urgente, color: '#FF4444' },
    { name: 'Alta', value: lastRecord.abertos_alta, color: '#FF8800' },
    { name: 'Média', value: lastRecord.abertos_média, color: '#FFDD44' },
    { name: 'Baixa', value: lastRecord.abertos_baixa, color: '#44DD44' },
  ] : []

  return (
    <div className="min-h-screen bg-bg p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1 
          className="text-3xl font-bold text-text mb-2 flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          T.I - Detalhes
        </motion.h1>
        <motion.p 
          className="text-text2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Monitoramento detalhado de chamados e SLA do sistema de T.I
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

      {/* Animação de chamados */}
      <motion.div 
        className="card mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <TicketAnimation />
      </motion.div>

      {/* Métricas principais */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <motion.div 
          className="card"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-semibold text-text mb-2">Total Abertos</h3>
          <div className="text-3xl font-bold text-blue-400">
            {lastRecord ? fmtNum(lastRecord.abertos) : 0}
          </div>
        </motion.div>

        <motion.div 
          className="card"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-semibold text-text mb-2">Em Andamento</h3>
          <div className="text-3xl font-bold text-yellow-400">
            {lastRecord ? fmtNum(lastRecord.andamento) : 0}
          </div>
        </motion.div>

        <motion.div 
          className="card"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-semibold text-text mb-2">Resolvidos Hoje</h3>
          <div className="text-3xl font-bold text-green-400">
            {lastRecord ? fmtNum(lastRecord.resolvidos_hoje) : 0}
          </div>
        </motion.div>

        <motion.div 
          className="card"
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-semibold text-text mb-2">Tempo Médio</h3>
          <div className="text-3xl font-bold text-purple-400">
            {lastRecord ? lastRecord.avg_min : '0'} min
          </div>
        </motion.div>
      </motion.div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de barras diário */}
        <motion.div 
          className="card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-semibold text-text mb-4">Evolução Diária dos Chamados</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                formatter={(value: number, name: string) => [fmtNum(value), name]}
              />
              <Bar dataKey="abertos" fill="#3B82F6" name="Abertos" radius={4}>
                <LabelList 
                  dataKey="abertos" 
                  position="top" 
                  formatter={(value: number) => fmtNum(value)}
                  style={{ fill: '#3B82F6', fontSize: '10px', fontWeight: 'bold' }}
                />
              </Bar>
              <Bar dataKey="andamento" fill="#F59E0B" name="Em Andamento" radius={4}>
                <LabelList 
                  dataKey="andamento" 
                  position="top" 
                  formatter={(value: number) => fmtNum(value)}
                  style={{ fill: '#F59E0B', fontSize: '10px', fontWeight: 'bold' }}
                />
              </Bar>
              <Bar dataKey="resolvidos_hoje" fill="#10B981" name="Resolvidos Hoje" radius={4}>
                <LabelList 
                  dataKey="resolvidos_hoje" 
                  position="top" 
                  formatter={(value: number) => fmtNum(value)}
                  style={{ fill: '#10B981', fontSize: '10px', fontWeight: 'bold' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Gráfico de pizza de prioridades */}
        <motion.div 
          className="card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          whileHover={{ y: -2 }}
        >
          <h3 className="text-lg font-semibold text-text mb-4">Distribuição por Prioridade (Abertos)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [fmtNum(value), 'Chamados']} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Tabela de registros recentes */}
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        whileHover={{ y: -2 }}
      >
        <h3 className="text-lg font-semibold text-text mb-4">Registros Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg2">
                <th className="text-left p-2">Data</th>
                <th className="text-right p-2">Abertos</th>
                <th className="text-right p-2">Em Andamento</th>
                <th className="text-right p-2">Resolvidos Hoje</th>
                <th className="text-right p-2">Urgente</th>
                <th className="text-right p-2">Alta</th>
                <th className="text-right p-2">Média</th>
                <th className="text-right p-2">Baixa</th>
                <th className="text-right p-2">Tempo Médio (min)</th>
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
                  transition={{ duration: 0.3, delay: idx * 0.05 + 1.1 }}
                  whileHover={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    transition: { duration: 0.2 }
                  }}
                >
                  <td className="p-2">{new Date(record.ref_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="p-2 text-right text-blue-400">{fmtNum(record.abertos)}</td>
                  <td className="p-2 text-right text-yellow-400">{fmtNum(record.andamento)}</td>
                  <td className="p-2 text-right text-green-400">{fmtNum(record.resolvidos_hoje)}</td>
                  <td className="p-2 text-right text-red-400">{fmtNum(record.abertos_urgente)}</td>
                  <td className="p-2 text-right text-orange-400">{fmtNum(record.abertos_alta)}</td>
                  <td className="p-2 text-right text-yellow-400">{fmtNum(record.abertos_média)}</td>
                  <td className="p-2 text-right text-green-400">{fmtNum(record.abertos_baixa)}</td>
                  <td className="p-2 text-right">{record.avg_min}</td>
                  <td className="p-2 text-right text-text2">
                    {new Date(record.updated_at).toLocaleString('pt-BR')}
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
