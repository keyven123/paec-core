import { api } from '@/lib/api'

export const userService = {
  async deleteAccount(): Promise<void> {
    await api.delete('/v1/profile/delete')
  },
}
