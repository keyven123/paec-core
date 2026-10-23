import { Navigate, useRouterState } from '@tanstack/react-router'

/**
 * Fallback for unknown URLs: send visitors to the homepage, and anything
 * under /admin to the admin dashboard, instead of showing a 404 page.
 */
export function NotFoundRedirect() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const attemptedPath =
    pathname || (typeof window !== 'undefined' ? window.location.pathname : '')

  if (attemptedPath.startsWith('/admin')) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Navigate to="/" replace />
}
