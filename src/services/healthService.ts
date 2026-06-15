import api from '@/lib/api'

export type ApiInfo = {
  type: string
  name: string
  version: string
  description: string
}

export type HealthStatus = {
  status: string
  database: string
  timestamp: string
}

export const healthService = {
  async getApiInfo(): Promise<ApiInfo> {
    // Use '' not '/' — axios treats leading slash as absolute from origin root
    const { data } = await api.get<ApiInfo>('')
    return data
  },

  async getHealth(): Promise<HealthStatus> {
    const { data } = await api.get<HealthStatus>('/health')
    return data
  },
}
