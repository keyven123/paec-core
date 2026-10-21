import { adminApi, api } from '@/lib/api'

export type CareerEmploymentType =
  | 'full-time'
  | 'part-time'
  | 'contract'
  | 'internship'
  | 'freelance'

export type CareerWorkSetup = 'on-site' | 'hybrid' | 'work-from-home'

export type CareerPosition = {
  uuid: string
  title: string
  department?: string | null
  location?: string | null
  work_setup: CareerWorkSetup
  employment_type: CareerEmploymentType
  description?: string | null
  requirements?: string | null
  status: 'draft' | 'published'
  sort_order: number
  applications_count?: number
  created_at?: string
  updated_at?: string
}

export type CareerPositionPayload = {
  title: string
  department?: string
  location?: string
  work_setup: CareerWorkSetup
  employment_type: CareerEmploymentType
  description?: string
  requirements?: string
  status: 'draft' | 'published'
  sort_order?: number
}

export type CareerApplicationStatus =
  | 'applied'
  | 'accepted'
  | 'for_interview'
  | 'completed'
  | 'denied'

export type CareerApplication = {
  uuid: string
  career_position_uuid: string
  user_uuid?: string | null
  full_name: string
  email: string
  phone?: string | null
  salary_expectation?: string | null
  resume_url?: string | null
  resume_file_name?: string | null
  cover_letter?: string | null
  status: CareerApplicationStatus
  interview_at?: string | null
  interview_location?: string | null
  created_at?: string
  updated_at?: string
  position?: Pick<
    CareerPosition,
    'uuid' | 'title' | 'department' | 'location' | 'work_setup' | 'employment_type'
  > | null
}

export type CareerApplicationPayload = {
  full_name: string
  email: string
  phone?: string
  salary_expectation: string
  resume_file?: File | null
  cover_letter?: string
}

export const APPLICATION_STATUS_LABELS: Record<CareerApplicationStatus, string> = {
  applied: 'Applied',
  accepted: 'Accepted',
  for_interview: 'For Interview',
  completed: 'Completed',
  denied: 'Denied',
}

export const APPLICATION_STATUS_STYLES: Record<CareerApplicationStatus, string> = {
  applied: 'border-violet-200 bg-violet-50 text-paec-violet',
  accepted: 'border-sky-200 bg-sky-50 text-sky-700',
  for_interview: 'border-amber-200 bg-amber-50 text-amber-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  denied: 'border-red-200 bg-red-50 text-red-700',
}

type PaginatedCareerPositions = {
  data: CareerPosition[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export const WORK_SETUP_LABELS: Record<CareerWorkSetup, string> = {
  'on-site': 'On-site',
  hybrid: 'Hybrid',
  'work-from-home': 'Work From Home',
}

export const EMPLOYMENT_TYPE_LABELS: Record<CareerEmploymentType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  freelance: 'Freelance',
}

type PaginatedCareerApplications = {
  data: CareerApplication[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export const careerService = {
  async listPublic(): Promise<CareerPosition[]> {
    const { data } = await api.get<{ data: CareerPosition[] }>('/v1/public/careers')
    return data.data ?? []
  },

  async getPublic(uuid: string): Promise<CareerPosition> {
    const { data } = await api.get<{ data: CareerPosition }>(`/v1/public/careers/${uuid}`)
    return data.data
  },

  async listPositions(params?: {
    q?: string
    status?: string
    page?: number
    per_page?: number
  }): Promise<PaginatedCareerPositions> {
    const { data } = await adminApi.get<PaginatedCareerPositions>(
      '/v1/careers/positions',
      { params },
    )
    return data
  },

  async getPosition(uuid: string): Promise<CareerPosition> {
    const { data } = await adminApi.get<{ data: CareerPosition }>(
      `/v1/careers/positions/${uuid}`,
    )
    return data.data
  },

  async createPosition(payload: CareerPositionPayload): Promise<CareerPosition> {
    const { data } = await adminApi.post<{ data: CareerPosition }>(
      '/v1/careers/positions',
      payload,
    )
    return data.data
  },

  async updatePosition(
    uuid: string,
    payload: CareerPositionPayload,
  ): Promise<CareerPosition> {
    const { data } = await adminApi.put<{ data: CareerPosition }>(
      `/v1/careers/positions/${uuid}`,
      payload,
    )
    return data.data
  },

  async deletePosition(uuid: string): Promise<void> {
    await adminApi.delete(`/v1/careers/positions/${uuid}`)
  },

  /** Logged-in customer submits an application (customer token via `api`). */
  async apply(
    positionUuid: string,
    payload: CareerApplicationPayload,
  ): Promise<CareerApplication> {
    const formData = new FormData()
    formData.append('full_name', payload.full_name)
    formData.append('email', payload.email)
    if (payload.phone) formData.append('phone', payload.phone)
    formData.append('salary_expectation', payload.salary_expectation)
    if (payload.cover_letter) formData.append('cover_letter', payload.cover_letter)
    if (payload.resume_file) formData.append('resume_file', payload.resume_file)

    const { data } = await api.post<{ data: CareerApplication }>(
      `/v1/customer/careers/${positionUuid}/apply`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data.data
  },

  async listMyApplications(): Promise<CareerApplication[]> {
    const { data } = await api.get<{ data: CareerApplication[] }>(
      '/v1/customer/careers/my-applications',
    )
    return data.data ?? []
  },

  async getMyApplication(positionUuid: string): Promise<CareerApplication | null> {
    const { data } = await api.get<{ data: CareerApplication | null; applied: boolean }>(
      `/v1/customer/careers/${positionUuid}/my-application`,
    )
    return data.data
  },

  async listApplications(params?: {
    q?: string
    status?: string
    career_position_uuid?: string
    page?: number
    per_page?: number
  }): Promise<PaginatedCareerApplications> {
    const { data } = await adminApi.get<PaginatedCareerApplications>(
      '/v1/careers/applications',
      { params },
    )
    return data
  },

  async updateApplicationStatus(
    uuid: string,
    payload: {
      status: CareerApplicationStatus
      interview_at?: string | null
      interview_location?: string | null
    },
  ): Promise<CareerApplication> {
    const { data } = await adminApi.put<{ data: CareerApplication }>(
      `/v1/careers/applications/${uuid}/status`,
      payload,
    )
    return data.data
  },
}
