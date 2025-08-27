import axios from 'axios'
import type { KpisResponse, SeriesResponse, SystemKey } from '../types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

const api = axios.create({
  baseURL: apiBaseUrl || '',
  timeout: 5000,
})

function generateMockKpis(system: SystemKey): KpisResponse {
  const seed = system.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const random = () => (Math.sin(seed + Date.now()) + 1) / 2
  
  return {
    values: [
      Math.floor(random() * 1000 + 100),
      Math.floor(random() * 500 + 50),
      Math.floor(random() * 200 + 20)
    ],
    updatedAt: new Date().toISOString()
  }
}

function generateMockSeries(system: SystemKey): SeriesResponse {
  const seed = system.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const points = []
  
  for (let i = 13; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const random = Math.sin(seed + i) * 50 + 100 + Math.random() * 50
    
    points.push({
      x: date.toISOString(),
      y: Math.max(0, Math.floor(random))
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
  const response = await fetch(`${API_BASE_URL}/api/detailed/${system}`)
  if (!response.ok) {
    throw new Error('Failed to fetch detailed data')
  }
  return response.json()
}
