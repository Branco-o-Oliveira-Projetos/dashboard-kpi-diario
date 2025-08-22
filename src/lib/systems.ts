import type { ChartType, SystemKey } from '../types'

type SystemDef = {
  title: string
  labels: string[] // Alterado para aceitar arrays de tamanho variável
  chartType: ChartType
}

export const SYSTEMS: Record<SystemKey, SystemDef> = {
  meta_ads: { title: 'Meta Ads', labels: ['Custo', 'Leads', 'Cliques', 'CPL', 'CPC'], chartType: 'line' },
  google_ads: { title: 'Google Ads', labels: ['Custo', 'Leads', 'Cliques', 'CPL', 'CPC'], chartType: 'bar' },
  piperun: { title: 'PipeRun (Oportunidades)', labels: ['Recebidas', 'Ganhas', 'Perdidas'], chartType: 'bar' },
  conta_azul: { title: 'Conta Azul (Pagamentos)', labels: ['Clientes novos', 'A receber', 'Recebidos'], chartType: 'bar' },
  cpj3c: { title: 'CPJ-3C (Processos)', labels: ['Audiências', 'Perícias', 'Processos'], chartType: 'bar' },
  ti: { title: 'T.I (Chamados)', labels: ['Abertos', 'Em andamento', 'Resolvidos'], chartType: 'bar' },
  liderhub: { title: 'Liderhub (Atendimentos)', labels: ['Aguardando', 'Em andamento', 'Finalizadas'], chartType: 'bar' },
  n8n: { title: 'N8N (Execuções)', labels: ['Fluxos', 'Sucesso', 'Falhas', 'AVG-seg'], chartType: 'line' },
}

export const SYSTEM_ORDER: SystemKey[] = [
  'meta_ads',
  'google_ads',
  'piperun',
  'conta_azul',
  'cpj3c',
  'ti',
  'liderhub',
  'n8n'
]
