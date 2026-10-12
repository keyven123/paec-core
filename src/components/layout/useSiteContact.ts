import { useQuery } from '@tanstack/react-query'

import { DEFAULT_FOOTER_SETTINGS, cmsService } from '@/services/cmsService'

export function useSiteContact() {
  const { data } = useQuery({
    queryKey: ['public-footer'],
    queryFn: () => cmsService.getPublicFooter(),
    staleTime: 5 * 60 * 1000,
  })

  return data ?? DEFAULT_FOOTER_SETTINGS
}
