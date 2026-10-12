import { useEffect, useRef, useState } from 'react'

import type { RefObject } from 'react'

const MOBILE_QUERY = '(max-width: 767px)'
const SCROLL_THRESHOLD = 8

/**
 * On mobile, hides the element while the user scrolls down the page and
 * brings it back as soon as they scroll up (or reach the top).
 */
export function useHideOnScroll(ref: RefObject<HTMLElement | null>): boolean {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const mobile = window.matchMedia(MOBILE_QUERY)
    let frame = 0

    const update = () => {
      frame = 0
      const y = Math.max(window.scrollY, 0)
      const element = ref.current
      const height = element?.offsetHeight ?? 0

      if (
        !mobile.matches ||
        y <= height ||
        element?.contains(document.activeElement)
      ) {
        lastY.current = y
        setHidden(false)
        return
      }

      const delta = y - lastY.current
      if (Math.abs(delta) < SCROLL_THRESHOLD) return

      setHidden(delta > 0)
      lastY.current = y
    }

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    lastY.current = window.scrollY
    window.addEventListener('scroll', onScroll, { passive: true })
    mobile.addEventListener('change', update)
    return () => {
      window.removeEventListener('scroll', onScroll)
      mobile.removeEventListener('change', update)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [ref])

  return hidden
}
