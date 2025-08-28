import axios from 'axios'
import type { KpisResponse, SeriesResponse, SystemKey } from '../types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

const api = axios.create({
  baseURL: apiBaseUrl || '',
  timeout: 5000,
})

function generateMockKpis(_system: SystemKey): KpisResponse {
  return {
    values: [0, 0, 0],
    updatedAt: new Date().toISOString()
  }
}

function generateMockSeries(system: SystemKey): SeriesResponse {
  const points = []
  
  for (let i = 13; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    points.push({
      x: date.toISOString(),
      y: 0
    })
  }
  
  return {
    points,
    label: system
  }
}

export async function fetchKpis(system: SystemKey): Promise<KpisResponse> {
  if (!apiBaseUrl) {
    return generateMockKpis(system)
  }
  
  try {
    const response = await api.get(`/api/kpis/${system}`)
    return response.data
  } catch {
    return generateMockKpis(system)
  }
}

export async function fetchSeries(system: SystemKey): Promise<SeriesResponse> {
  if (!apiBaseUrl) {
    return generateMockSeries(system)
  }
  
  try {
    const response = await api.get(`/api/series/${system}`)
    return response.data
  } catch {
    return generateMockSeries(system)
  }
}

export async function fetchDetailedData(system: string) {
  if (!apiBaseUrl) {
    throw new Error('API Base URL not configured')
  }
  
  try {
    const response = await api.get(`/api/detailed/${system}`)
    return response.data
  } catch (error) {
    console.error('Error fetching detailed data:', error)
    throw new Error('Failed to fetch detailed data')
  }
}

export async function fetchPiperunAllPipelines() {
  if (!apiBaseUrl) {
    throw new Error('API Base URL not configured')
  }
  
  try {
    const response = await api.get('/api/detailed/piperun/all')
    return response.data
  } catch (error) {
    console.error('Error fetching PipeRun all pipelines data:', error)
    throw new Error('Failed to fetch PipeRun all pipelines data')
  }
}
