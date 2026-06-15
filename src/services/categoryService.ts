import { adminApi } from '@/lib/api'

export type Category = {
  uuid: string
  name: string
}

export const categoryService = {
  async listCategories(perPage = 100): Promise<Category[]> {
    const { data } = await adminApi.get<{
      data: Category[]
    }>('/v1/categories', {
      params: { per_page: perPage },
    })
    return data.data ?? []
  },
}
