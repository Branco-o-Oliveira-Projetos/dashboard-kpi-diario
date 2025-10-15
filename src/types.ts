export type ChartType = 'bar' | 'line'

export type SystemKey =
  | 'meta_ads'
  | 'google_ads'
  | 'conta_azul'
  | 'piperun'
  | 'cpj3c'
  | 'ti'
  | 'liderhub'
  | 'n8n'
  | 'evolution'

export type KpisResponse = {
  values: Array<number | null>
  updatedAt: string
}

export type SeriesPoint = { x: string; y: number }
export type SeriesResponse = { points: SeriesPoint[]; label: string }
