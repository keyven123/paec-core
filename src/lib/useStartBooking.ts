import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import type { CheckoutSession } from '@/lib/checkoutSession'
import { getApiErrorMessage } from '@/lib/api'
import { isCustomerAuthenticated } from '@/lib/auth'
import { addSessionToCart } from '@/lib/cart'
import {
  clearCheckoutSession,
  getTicketCount,
  saveCheckoutSession,
} from '@/lib/checkoutSession'
import { trackInitiateCheckout } from '@/lib/metaPixel'

/**
 * Signed-in customers collect bookings in their cart; guests check out one activity at a time.
 */
export function useStartBooking() {
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)

  const startBooking = async (session: CheckoutSession) => {
    trackInitiateCheckout({
      content_name: session.attractionName,
      content_ids: [session.eventUuid || session.attractionId],
      content_type: 'product',
      value: session.total,
      currency: 'PHP',
      num_items: getTicketCount(session),
    })

    if (!isCustomerAuthenticated()) {
      saveCheckoutSession(session)
      void navigate({ to: '/checkout' })
      return
    }

    setAdding(true)
    try {
      await addSessionToCart(session)
      clearCheckoutSession()
      toast.success(`${session.attractionName} was added to your cart`)
      void navigate({ to: '/checkout' })
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'We could not add these tickets to your cart.',
        ),
      )
    } finally {
      setAdding(false)
    }
  }

  return { startBooking, adding }
}
