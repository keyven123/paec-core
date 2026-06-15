import { adminApi } from '@/lib/api'

export const adminTicketService = {
  async cancelTicket(ticketUuid: string, remarks = ''): Promise<void> {
    await adminApi.put(`/v1/tickets/${ticketUuid}/cancel`, { remarks })
  },

  async transferTicket(ticketUuid: string, userUuid: string): Promise<void> {
    await adminApi.post(`/v1/tickets/${ticketUuid}/transfer`, {
      user_uuid: userUuid,
    })
  },
}
