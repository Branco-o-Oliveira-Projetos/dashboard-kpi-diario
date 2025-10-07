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
  conta_azul: { title: 'Conta Azul (R$ Recebidos)', labels: ['A receber', 'Recebido', 'A Pagar'], chartType: 'bar' },
  cpj3c: { title: 'CPJ-3C (Processos)', labels: ['Audiências', 'Perícias', 'Processos'], chartType: 'bar' },
  ti: { title: 'T.I (Chamados)', labels: ['Abertos', 'Em andamento', 'Resolvidos'], chartType: 'bar' },
  liderhub: { title: 'Liderhub (Atendimentos)', labels: ['Aguardando', 'Em andamento', 'Finalizadas'], chartType: 'bar' },
  n8n: { title: 'N8N (Execuções)', labels: ['Fluxos', 'Sucesso', 'Falhas', 'AVG'], chartType: 'bar' },
  evolution: { title: 'Evolution (Instâncias)', labels: ['Instâncias Ativas', 'Instâncias Inativas', 'Mensagens Enviadas', 'Tempo Médio (min)', 'Total Instâncias'], chartType: 'bar' }
}

export const SYSTEM_ORDER: SystemKey[] = [
  'meta_ads',
  'google_ads',
  'conta_azul',
  'piperun',
  'n8n',
  'cpj3c',
  'liderhub',
  'ti',
  'evolution'
]
