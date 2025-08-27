import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fetchDetailedData } from '../lib/api'
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
    queryKey: ['piperun-detail'],
    queryFn: () => fetchDetailedData('piperun'),
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  })

  if (isLoading) return <div className="p-8">Carregando...</div>
  if (error) return <div className="p-8 text-red-500">Erro ao carregar dados</div>

  const records: PiperunData[] = data || []
  
  // Separar dados por pipeline
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
    <div className="max-w-[1600px] mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text mb-2">PipeRun - Detalhes</h1>
        <p className="text-text2">Análise detalhada das oportunidades por pipeline</p>
        <Link to="/" className="text-blue-400 hover:underline mt-2 inline-block">← Voltar ao Dashboard</Link>
      </div>

      {/* Layout 1x3 para os 3 pipelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {pipelines.map((pipeline, index) => {
          const dailyData = preparePipelineData(pipeline.data)
          const latestRecord = pipeline.data[0] || {}
          const colors = ['#06004B', '#4A90E2', '#10B981']
          const color = colors[index % colors.length]

          return (
            <motion.div 
              key={pipeline.name} 
              className="card" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-bold text-text mb-4 text-center">
                {pipeline.name}
              </h2>

              {/* KPIs do Pipeline */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-bg2 rounded-lg">
                  <div className="text-lg font-bold text-text">
                    {fmtNum(latestRecord.oportunidades_recebidas)}
                  </div>
                  <div className="text-xs text-text2">Recebidas</div>
                </div>
                <div className="text-center p-2 bg-bg2 rounded-lg">
                  <div className="text-lg font-bold text-green-400">
                    {fmtNum(latestRecord.oportunidades_ganhas)}
                  </div>
                  <div className="text-xs text-text2">Ganhas</div>
                </div>
                <div className="text-center p-2 bg-bg2 rounded-lg">
                  <div className="text-lg font-bold text-red-400">
                    {fmtNum(latestRecord.oportunidades_perdidas)}
                  </div>
                  <div className="text-xs text-text2">Perdidas</div>
                </div>
              </div>

              {/* Gráfico de Oportunidades Recebidas */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-text2 mb-2">Oportunidades Recebidas</h4>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).getDate().toString()}
                        fontSize={10}
                      />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                        formatter={(value: number) => [fmtNum(value), 'Recebidas']}
                      />
                      <Bar dataKey="recebidas" fill={color} radius={2} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Ganhas vs Perdidas */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-text2 mb-2">Ganhas vs Perdidas</h4>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).getDate().toString()}
                        fontSize={10}
                      />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                        formatter={(value: number, name: string) => [
                          fmtNum(value), 
                          name === 'ganhas' ? 'Ganhas' : 'Perdidas'
                        ]}
                      />
                      <Line type="monotone" dataKey="ganhas" stroke="#10B981" strokeWidth={2} name="ganhas" />
                      <Line type="monotone" dataKey="perdidas" stroke="#EF4444" strokeWidth={2} name="perdidas" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Taxa de Conversão */}
              <div>
                <h4 className="text-sm font-semibold text-text2 mb-2">Taxa de Conversão (%)</h4>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData.map(item => ({
                      ...item,
                      taxa: item.recebidas > 0 ? (item.ganhas / item.recebidas * 100) : 0
                    }))}>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).getDate().toString()}
                        fontSize={10}
                      />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa de Conversão']}
                      />
                      <Line type="monotone" dataKey="taxa" stroke="#8B5CF6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Tabela Consolidada */}
      <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h3 className="card-title">Registros Recentes - Todos os Pipelines</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg2">
                <th className="text-left p-2">Data</th>
                <th className="text-left p-2">Pipeline</th>
                <th className="text-right p-2">Recebidas</th>
                <th className="text-right p-2">Ganhas</th>
                <th className="text-right p-2">Perdidas</th>
                <th className="text-right p-2">Taxa Conversão</th>
                <th className="text-right p-2">Última Atualização</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 20).map((record, idx) => {
                const taxa = record.oportunidades_recebidas > 0 ? 
                  (record.oportunidades_ganhas / record.oportunidades_recebidas * 100) : 0
                return (
                  <tr key={idx} className="border-b border-bg2/50 hover:bg-bg2/20">
                    <td className="p-2">{new Date(record.ref_date).toLocaleDateString('pt-BR')}</td>
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
