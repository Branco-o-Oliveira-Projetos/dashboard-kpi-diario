import type { ChartType, SystemKey } from '../types'

type SystemDef = {
  title: string
  labels: string[] // já flexível para diferentes quantidades de indicadores
  chartType: ChartType
}

export const SYSTEMS: Record<SystemKey, SystemDef> = {
  meta_ads: { title: 'Meta Ads (Cliques)', labels: ['Custo', 'Leads', 'Cliques', 'CPL', 'CPC'], chartType: 'bar' },
  google_ads: { title: 'Google Ads (Cliques)', labels: ['Custo', 'Leads', 'Cliques', 'CPL', 'CPC'], chartType: 'bar' },
  piperun: { title: 'PipeRun (Oportunidades)', labels: ['Recebidas', 'Ganhas', 'Perdidas'], chartType: 'bar' },
  conta_azul: { title: 'Conta Azul (Pagamentos)', labels: ['Clientes novos', 'A receber', 'Recebidos'], chartType: 'bar' },
  cpj3c: { title: 'CPJ-3C (Processos)', labels: ['Audiências', 'Perícias', 'Processos'], chartType: 'bar' },
  ti: { title: 'T.I (Chamados)', labels: ['Abertos', 'Em andamento', 'Resolvidos'], chartType: 'bar' },
  liderhub: { title: 'Liderhub (Atendimentos)', labels: ['Aguardando', 'Em andamento', 'Finalizadas'], chartType: 'bar' },
  n8n: { title: 'N8N (Execuções)', labels: ['Fluxos', 'Sucesso', 'Falhas', 'AVG'], chartType: 'bar' },
}

export const SYSTEM_ORDER: SystemKey[] = [
  'meta_ads',
  'google_ads',
  'piperun',
  'n8n',
  'cpj3c',
  'conta_azul',
  'liderhub',
  'ti'
]
