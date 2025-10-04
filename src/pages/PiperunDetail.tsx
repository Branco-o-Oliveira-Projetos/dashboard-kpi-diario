import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { fetchPiperunAllPipelines } from '../lib/api'
import { fmtNum } from '../lib/format'
import { Link } from 'react-router-dom'

interface PiperunData {
  ref_date: string
  pipeline_id: string
  pipeline_name: string
  oportunidades_recebidas: number
  oportunidades_perdidas: number
  oportunidades_ganhas: number
  updated_at: string
}

export default function PiperunDetail() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['piperun-all-pipelines'],
    queryFn: () => fetchPiperunAllPipelines(),
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <motion.div 
              className="h-6 bg-bg2 rounded-lg mb-4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            />
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[...Array(3)].map((_, j) => (
                <motion.div 
                  key={j}
                  className="h-16 bg-bg2 rounded-lg"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: (i * 0.3) + (j * 0.1) }}
                />
              ))}
            </div>
            {[...Array(3)].map((_, j) => (
              <motion.div 
                key={j}
                className="h-32 bg-bg2 rounded-lg mb-4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: (i * 0.3) + (j * 0.2) }}
              />
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  )
  if (error) return <div className="p-8 text-red-500">Erro ao carregar dados</div>

  const records: PiperunData[] = data || []
  
  // Separar dados por pipeline (o backend já filtra pelas 3 pipelines específicas)
  const pipelineData = records.reduce((acc, item) => {
    if (!acc[item.pipeline_id]) {
      acc[item.pipeline_id] = {
        name: item.pipeline_name,
        data: []
      }
    }
    acc[item.pipeline_id].data.push(item)
    return acc
  }, {} as Record<string, { name: string; data: PiperunData[] }>)

  const pipelines = Object.values(pipelineData)

  // Preparar dados diários para cada pipeline
  const preparePipelineData = (pipelineRecords: PiperunData[]) => {
    return pipelineRecords.reduce((acc, item) => {
      const date = item.ref_date
      const existing = acc.find(d => d.date === date)
      
      if (existing) {
        existing.recebidas += item.oportunidades_recebidas
        existing.perdidas += item.oportunidades_perdidas
        existing.ganhas += item.oportunidades_ganhas
      } else {
        acc.push({
          date,
          recebidas: item.oportunidades_recebidas,
          perdidas: item.oportunidades_perdidas,
          ganhas: item.oportunidades_ganhas
        })
      }
      return acc
    }, [] as any[]).slice(0, 30).reverse()
  }

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
          className="text-3xl font-bold text-text mb-2 flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          PipeRun - Detalhes
        </motion.h1>
        <motion.p 
          className="text-text2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Análise detalhada das oportunidades por pipeline
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
          
          {/* <motion.div
            className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-purple-400">🎯 Exibindo pipelines:</span>
              <span className="text-text font-medium">78157, 78175, 78291</span>
            </div>
          </motion.div> */}
        </motion.div>
      </motion.div>

      {/* Layout responsivo para as pipelines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6">
        {pipelines.map((pipeline, index) => {
          const dailyData = preparePipelineData(pipeline.data)
          const latestRecord = pipeline.data[0] || {}
          const colors = ['#22D3EE', '#06B6D4', '#A855F7', '#EC4899', '#A855F7']
          const color = colors[index % colors.length]

          return (
            <motion.div 
              key={pipeline.name} 
              className="card w-full min-h-0 flex flex-col" 
              initial={{ opacity: 0, y: 30, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100 
              }}
              whileHover={{ 
                y: -5, 
                scale: 1.02,
                transition: { duration: 0.2 } 
              }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.h2 
                className="text-lg sm:text-xl font-bold text-text mb-3 sm:mb-4 text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
              >
                {pipeline.name}
              </motion.h2>

              {/* KPIs do Pipeline */}
              <motion.div 
                className="grid grid-cols-3 gap-1 sm:gap-2 mb-3 sm:mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
              >
                <motion.div 
                  className="text-center p-1 sm:p-2 bg-bg2 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className="text-sm sm:text-lg font-bold text-text"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.1 + 0.4,
                      type: "spring",
                      stiffness: 200 
                    }}
                  >
                    {fmtNum(latestRecord.oportunidades_recebidas)}
                  </motion.div>
                  <div className="text-xs text-text2">Recebidas</div>
                </motion.div>
                <motion.div 
                  className="text-center p-1 sm:p-2 bg-bg2 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className="text-sm sm:text-lg font-bold text-green-400"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.1 + 0.5,
                      type: "spring",
                      stiffness: 200 
                    }}
                  >
                    {fmtNum(latestRecord.oportunidades_ganhas)}
                  </motion.div>
                  <div className="text-xs text-text2">Ganhas</div>
                </motion.div>
                <motion.div 
                  className="text-center p-1 sm:p-2 bg-bg2 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className="text-sm sm:text-lg font-bold text-red-400"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.1 + 0.6,
                      type: "spring",
                      stiffness: 200 
                    }}
                  >
                    {fmtNum(latestRecord.oportunidades_perdidas)}
                  </motion.div>
                  <div className="text-xs text-text2">Perdidas</div>
                </motion.div>
              </motion.div>

              {/* Gráfico de Oportunidades Recebidas */}
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 + 0.7 }}
              >
                <h4 className="text-xs sm:text-sm font-semibold text-text2 mb-2">Oportunidades Recebidas</h4>
                <motion.div 
                  className="h-24 sm:h-28 lg:h-32"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
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
                      <Tooltip 
                        labelFormatter={(value) => {
                          const date = new Date(value + 'T00:00:00')
                          return date.toLocaleDateString('pt-BR')
                        }}
                        formatter={(value: number) => [fmtNum(value), 'Recebidas']}
                      />
                      <Bar dataKey="recebidas" fill={color} radius={2} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </motion.div>

              {/* Gráfico de Ganhas vs Perdidas */}
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 + 0.8 }}
              >
                <h4 className="text-xs sm:text-sm font-semibold text-text2 mb-2">Ganhas vs Perdidas</h4>
                <motion.div 
                  className="h-24 sm:h-28 lg:h-32"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
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
                      <Tooltip 
                        labelFormatter={(value) => {
                          const date = new Date(value + 'T00:00:00')
                          return date.toLocaleDateString('pt-BR')
                        }}
                        formatter={(value: number, name: string) => [
                          fmtNum(value), 
                          name === 'ganhas' ? 'Ganhas' : 'Perdidas'
                        ]}
                      />
                      <Line type="monotone" dataKey="ganhas" stroke="#06B6D4" strokeWidth={2} name="ganhas" />
                      <Line type="monotone" dataKey="perdidas" stroke="#f87171" strokeWidth={2} name="perdidas" />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              </motion.div>

              {/* Taxa de Conversão */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 + 0.9 }}
              >
                <h4 className="text-xs sm:text-sm font-semibold text-text2 mb-2">Taxa de Conversão (%)</h4>
                <motion.div 
                  className="h-24 sm:h-28 lg:h-32"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData.map(item => ({
                      ...item,
                      taxa: item.recebidas > 0 ? (item.ganhas / item.recebidas * 100) : 0
                    }))}>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value + 'T00:00:00')
                          return date.getDate().toString()
                        }}
                        fontSize={10}
                      />
                      <Tooltip 
                        labelFormatter={(value) => {
                          const date = new Date(value + 'T00:00:00')
                          return date.toLocaleDateString('pt-BR')
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa de Conversão']}
                      />
                      <Line type="monotone" dataKey="taxa" stroke="#71F871" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Tabela Consolidada */}
      <motion.div 
        className="card" 
        initial={{ opacity: 0, y: 50 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        whileHover={{ y: -2 }}
      >
        <motion.h3 
          className="card-title"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          Registros Recentes - Pipelines Específicas ({records.length} registros)
        </motion.h3>
        <motion.div 
          className="overflow-x-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <motion.table 
            className="w-full text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.3 }}
          >
            <motion.thead
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.4 }}
            >
              <tr className="border-b border-bg2">
                <th className="text-left p-2">Data</th>
                <th className="text-left p-2">Pipeline</th>
                <th className="text-right p-2">Recebidas</th>
                <th className="text-right p-2">Ganhas</th>
                <th className="text-right p-2">Perdidas</th>
                <th className="text-right p-2">Taxa Conversão</th>
                <th className="text-right p-2">Última Atualização</th>
              </tr>
            </motion.thead>
            <tbody>
              {records.slice(0, 20).map((record, idx) => {
                const taxa = record.oportunidades_recebidas > 0 ? 
                  (record.oportunidades_ganhas / record.oportunidades_recebidas * 100) : 0
                return (
                  <motion.tr 
                    key={idx} 
                    className="border-b border-bg2/50 hover:bg-bg2/20"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 + 1.5 }}
                    whileHover={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      transition: { duration: 0.2 }
                    }}
                  >
                    <td className="p-2">{new Date(record.ref_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="p-2 truncate max-w-[200px]" title={record.pipeline_name}>
                      {record.pipeline_name}
                    </td>
                    <td className="p-2 text-right">{fmtNum(record.oportunidades_recebidas)}</td>
                    <td className="p-2 text-right text-green-400">{fmtNum(record.oportunidades_ganhas)}</td>
                    <td className="p-2 text-right text-red-400">{fmtNum(record.oportunidades_perdidas)}</td>
                    <td className="p-2 text-right">{taxa.toFixed(1)}%</td>
                    <td className="p-2 text-right text-text2">
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
