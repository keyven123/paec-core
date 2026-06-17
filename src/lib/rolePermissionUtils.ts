import type {
  MerchantPartnerPermissionCatalogEntry,
  PermissionCatalogItem,
} from '@/services/permissionCatalogService'

export type AccessAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'execute'
  | 'add'

export type RoleTypeFilter = 'all' | 'admin' | 'customer'

/** Platform admin permissions that map to modules in paec-core admin. */
export const PAEC_PLATFORM_ADMIN_PERMISSION_CODES = new Set([
  'dashboard',
  'analytics',
  'finance',
  'users',
  'admin-users',
  'roles',
  'permissions',
  'tickets',
  'events',
  'event-tickets',
  'event-scanner',
  'schedules',
  'schedule-times',
  'categories',
  'uploads',
  'venues',
  'transactions',
  'promo-codes',
  'cms',
  'organizations',
  'profile',
])

/** Merchant partner permissions relevant to PAEC (no affiliate, compliance, or ticketoc-only modules). */
export const PAEC_MERCHANT_PARTNER_PERMISSION_CODES = new Set([
  'events',
  'event-tickets',
  'event-scanner',
  'schedules',
  'schedule-times',
  'categories',
  'uploads',
  'venues',
  'transactions',
  'promo-codes',
  'admin-users',
  'roles',
  'profile',
])

export function permissionsForPaecCatalog(
  permissions: PermissionCatalogItem[],
): PermissionCatalogItem[] {
  return permissions.filter((permission) => (permission.role_scope ?? 'admin') === 'shared')
}

export function permissionsForPaecAdmin(
  permissions: PermissionCatalogItem[],
  _isAdmin: boolean,
): PermissionCatalogItem[] {
  return permissionsForPaecCatalog(permissions)
}

export function permissionsForRoleType(
  permissions: PermissionCatalogItem[],
  isAdmin: boolean,
): PermissionCatalogItem[] {
  return permissions.filter((permission) => {
    const scope = permission.role_scope ?? 'admin'
    if (scope === 'shared') return true
    return isAdmin ? scope === 'admin' : scope === 'organizer'
  })
}

const DEFAULT_PERMISSION_MODULE = 'Other Module'

export type PermissionModuleGroup = {
  module: string
  permissions: PermissionCatalogItem[]
}

export function groupPermissionsByModule(items: PermissionCatalogItem[]): PermissionModuleGroup[] {
  const groups = new Map<string, PermissionCatalogItem[]>()

  for (const item of items) {
    const moduleName = item.module?.trim() || DEFAULT_PERMISSION_MODULE
    const list = groups.get(moduleName) ?? []
    list.push(item)
    groups.set(moduleName, list)
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([module, permissions]) => ({
      module,
      permissions: [...permissions].sort((a, b) => a.name.localeCompare(b.name)),
    }))
}

export const ACCESS_ACTIONS: { letter: string; action: AccessAction; label: string }[] = [
  { letter: 'r', action: 'view', label: 'View' },
  { letter: 'w', action: 'create', label: 'Create' },
  { letter: 'u', action: 'update', label: 'Update' },
  { letter: 'd', action: 'delete', label: 'Delete' },
  { letter: 'e', action: 'export', label: 'Export' },
  { letter: 'i', action: 'import', label: 'Import' },
  { letter: 'x', action: 'execute', label: 'Execute' },
  { letter: 'a', action: 'add', label: 'Add' },
]

export function applyMerchantPartnerPermissionCatalog(
  permissions: PermissionCatalogItem[],
  catalog: MerchantPartnerPermissionCatalogEntry[],
): PermissionCatalogItem[] {
  const catalogByCode = new Map(catalog.map((entry) => [entry.code, entry.available_access]))
  const letterOrder = ACCESS_ACTIONS.map((action) => action.letter)

  return permissions
    .filter((permission) => catalogByCode.has(permission.code))
    .map((permission) => {
      const allowedLetters = new Set((catalogByCode.get(permission.code) ?? '').split(''))
      return {
        ...permission,
        available_access: letterOrder.filter((letter) => allowedLetters.has(letter)),
      }
    })
}

export function grantsToAccessMap(
  grants: { code: string; available_access: string }[],
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const grant of grants) {
    map[grant.code] = grant.available_access ?? ''
  }
  return map
}

export function accessMapToGrants(
  map: Record<string, string>,
): { code: string; available_access: string }[] {
  return Object.entries(map)
    .filter(([, access]) => access.length > 0)
    .map(([code, available_access]) => ({ code, available_access }))
}

export function toggleAccessLetter(current: string, letter: string, enabled: boolean): string {
  const letters = new Set(current.split(''))
  if (enabled) {
    letters.add(letter)
  } else {
    letters.delete(letter)
  }
  return ACCESS_ACTIONS.map((a) => (letters.has(a.letter) ? a.letter : ''))
    .filter(Boolean)
    .join('')
}

export function hasAccessLetter(access: string, letter: string): boolean {
  return access.includes(letter)
}

export function slugifyRoleCode(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
