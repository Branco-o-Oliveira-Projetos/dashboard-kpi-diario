export type ChartType = 'bar' | 'line'

export type SystemKey =
  | 'meta_ads'
  | 'google_ads'
  | 'piperun'
  | 'conta_azul'
  | 'cpj3c'
  | 'ti'
  | 'liderhub'
  | 'n8n'

export type KpisResponse = {
  values: Array<number | null>
  updatedAt: string
}

export type SeriesPoint = { x: string; y: number }
export type SeriesResponse = { points: SeriesPoint[]; label: string }
