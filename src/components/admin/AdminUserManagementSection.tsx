import {
  BarChart3,
  ChevronDown,
  Download,
  Eye,
  Hexagon,
  KeyRound,
  MoreVertical,
  Plus,
  Search,
  Shield,
  Trash2,
  User,
  UserPlus,
  Users,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { AddUserModal } from '@/components/admin/AddUserModal'
import { CreateRoleModal } from '@/components/admin/CreateRoleModal'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { type RoleType, type UserStatus } from '@/data/mockAdminUsers'
import { getApiErrorMessage } from '@/lib/api'
import {
  groupPermissionsByModule,
  permissionsForPaecCatalog,
} from '@/lib/rolePermissionUtils'
import { cn } from '@/lib/utils'
import {
  permissionCatalogService,
  type PermissionCatalogItem,
} from '@/services/permissionCatalogService'
import { roleService, type Role } from '@/services/roleService'
import {
  userManagementService,
  type AdminUser,
  type CustomerUser,
} from '@/services/userManagementService'

type UserTab = 'admin' | 'customer' | 'roles'

const userTabs: { id: UserTab; label: string; icon: typeof Shield }[] = [
  { id: 'admin', label: 'Admin', icon: Shield },
  { id: 'customer', label: 'Customer', icon: User },
  { id: 'roles', label: 'Roles & Permissions', icon: KeyRound },
]

const CUSTOMERS_PER_PAGE = 15
const ADMIN_USERS_PER_PAGE = 15

function countRoleModules(role: Role, catalog: PermissionCatalogItem[]): number {
  const codes = new Set((role.permission_grants ?? []).map((grant) => grant.code))
  const modules = new Set(
    catalog
      .filter((item) => codes.has(item.code))
      .map((item) => item.module?.trim() || 'Other Module'),
  )
  return modules.size
}

function getRolePermissionLabels(role: Role, catalog: PermissionCatalogItem[]): string[] {
  const catalogByCode = new Map(catalog.map((item) => [item.code, item.name]))
  return (role.permission_grants ?? [])
    .filter((grant) => grant.available_access.length > 0)
    .map((grant) => catalogByCode.get(grant.code) ?? grant.code)
}

function formatBirthDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

function getUserInitials(user: CustomerUser): string {
  const first = user.first_name?.[0] ?? ''
  const last = user.last_name?.[0] ?? ''
  return (first + last).toUpperCase() || '?'
}

function normalizeStatus(status: string): UserStatus {
  return status.toLowerCase() === 'inactive' ? 'inactive' : 'active'
}

const inputClassName = cn(
  'h-9 w-full rounded-lg border border-violet-100 bg-white pr-3 pl-9 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize',
        status === 'active' && 'bg-emerald-100 text-emerald-700',
        status === 'inactive' && 'bg-red-100 text-red-600',
      )}
    >
      {status}
    </span>
  )
}

function RoleTypeBadge({ type }: { type: RoleType }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize',
        type === 'admin' && 'bg-violet-100 text-paec-violet',
        type === 'customer' && 'bg-orange-100 text-paec-orange',
      )}
    >
      {type}
    </span>
  )
}

function UserAvatar({ user }: { user: CustomerUser }) {
  const initials = getUserInitials(user)

  if (user.image?.url) {
    return (
      <img
        src={user.image.url}
        alt={user.full_name}
        className="size-8 shrink-0 rounded-full object-cover"
      />
    )
  }

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-paec-violet text-xs font-bold text-white">
      {initials}
    </div>
  )
}

function RowActions({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => toast.info(`${label} actions coming soon.`)}
      className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-violet-100 hover:text-foreground"
      aria-label={`Actions for ${label}`}
    >
      <MoreVertical className="size-3.5" />
    </button>
  )
}

const customerActionButtonClassName = cn(
  'inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-xs font-semibold text-paec-violet transition-colors hover:bg-violet-50',
)

function CustomerRowActions({ user }: { user: CustomerUser }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        to="/admin/usermanagement/$userUuid"
        params={{ userUuid: user.uuid }}
        className={customerActionButtonClassName}
      >
        <Eye className="size-3.5" />
        View
      </Link>
      <Link
        to="/admin/usermanagement/$userUuid/stats"
        params={{ userUuid: user.uuid }}
        className={customerActionButtonClassName}
      >
        <BarChart3 className="size-3.5" />
        Stats
      </Link>
    </div>
  )
}

export function AdminUserManagementSection() {
  const [activeTab, setActiveTab] = useState<UserTab>('admin')
  const [search, setSearch] = useState('')
  const [roleSearch, setRoleSearch] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [createRoleOpen, setCreateRoleOpen] = useState(false)

  const [customerUsers, setCustomerUsers] = useState<CustomerUser[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customersError, setCustomersError] = useState<string | null>(null)
  const [customerPage, setCustomerPage] = useState(1)
  const [customerTotalPages, setCustomerTotalPages] = useState(1)
  const [customerTotal, setCustomerTotal] = useState(0)

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState<string | null>(null)
  const [adminPage, setAdminPage] = useState(1)
  const [adminTotalPages, setAdminTotalPages] = useState(1)
  const [adminTotal, setAdminTotal] = useState(0)

  const [roles, setRoles] = useState<Role[]>([])
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionCatalogItem[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (activeTab === 'customer' || activeTab === 'admin') {
      setCustomerPage(1)
      setAdminPage(1)
    }
  }, [debouncedSearch, activeTab])

  const loadAdminUsers = useCallback(async () => {
    if (activeTab !== 'admin') return

    setAdminLoading(true)
    setAdminError(null)

    try {
      const response = await userManagementService.getAdminUsers({
        is_admin: 1,
        q: debouncedSearch.trim() || undefined,
        page: adminPage,
        per_page: ADMIN_USERS_PER_PAGE,
      })

      setAdminUsers(response.data ?? [])
      setAdminTotalPages(Math.max(1, response.meta?.last_page ?? 1))
      setAdminTotal(response.meta?.total ?? 0)
    } catch (err) {
      setAdminError(getApiErrorMessage(err, 'Failed to load admin users.'))
      setAdminUsers([])
    } finally {
      setAdminLoading(false)
    }
  }, [activeTab, adminPage, debouncedSearch])

  const loadRoles = useCallback(async () => {
    if (activeTab !== 'roles') return

    setRolesLoading(true)
    setRolesError(null)

    try {
      const [rolesData, permissionsData] = await Promise.all([
        roleService.getRoles({ is_admin: 1 }),
        permissionCatalogService.getPermissions(),
      ])
      setRoles(rolesData)
      setPermissionCatalog(permissionsForPaecCatalog(permissionsData))
    } catch (err) {
      setRolesError(getApiErrorMessage(err, 'Failed to load roles.'))
      setRoles([])
    } finally {
      setRolesLoading(false)
    }
  }, [activeTab])

  const loadCustomers = useCallback(async () => {
    if (activeTab !== 'customer') return

    setCustomersLoading(true)
    setCustomersError(null)

    try {
      const response = await userManagementService.getCustomers({
        q: debouncedSearch.trim() || undefined,
        page: customerPage,
        per_page: CUSTOMERS_PER_PAGE,
      })

      setCustomerUsers(response.data ?? [])
      setCustomerTotalPages(Math.max(1, response.meta?.last_page ?? 1))
      setCustomerTotal(response.meta?.total ?? 0)
    } catch (err) {
      setCustomersError(getApiErrorMessage(err, 'Failed to load customers.'))
      setCustomerUsers([])
    } finally {
      setCustomersLoading(false)
    }
  }, [activeTab, customerPage, debouncedSearch])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    void loadAdminUsers()
  }, [loadAdminUsers])

  useEffect(() => {
    void loadRoles()
  }, [loadRoles])

  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase()
    return roles.filter((role) => {
      if (!role.is_admin) return false
      const matchesSearch =
        !query ||
        role.name.toLowerCase().includes(query) ||
        role.code.toLowerCase().includes(query)
      return matchesSearch
    })
  }, [roles, roleSearch])

  const selectedRole = useMemo(
    () => roles.find((role) => role.uuid === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  )

  const handleTabChange = (tab: UserTab) => {
    setActiveTab(tab)
    setSearch('')
    if (tab !== 'roles') {
      setSelectedRoleId(null)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground lg:text-2xl">
            User Management
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Manage users and their access permissions
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'customer') {
                void userManagementService.exportCustomers().catch(() => {
                  toast.error('Failed to export customers.')
                })
                return
              }
              toast.info('Export coming soon.')
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-violet-50 sm:text-sm"
          >
            <Download className="size-3.5" />
            Export
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => setAddUserOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-paec-violet px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-paec-violet-dark sm:text-sm"
          >
            <UserPlus className="size-3.5" />
            Add User
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {userTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-sm',
                isActive
                  ? 'bg-paec-orange text-white shadow-sm shadow-paec-orange/20'
                  : 'border border-violet-100 bg-white text-muted-foreground hover:bg-violet-50 hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'admin' && (
        <AdminUsersTab
          search={search}
          onSearchChange={setSearch}
          users={adminUsers}
          loading={adminLoading}
          error={adminError}
          page={adminPage}
          totalPages={adminTotalPages}
          total={adminTotal}
          onPageChange={setAdminPage}
        />
      )}

      {activeTab === 'customer' && (
        <CustomerUsersTab
          search={search}
          onSearchChange={setSearch}
          users={customerUsers}
          loading={customersLoading}
          error={customersError}
          page={customerPage}
          totalPages={customerTotalPages}
          total={customerTotal}
          onPageChange={setCustomerPage}
        />
      )}

      {activeTab === 'roles' && (
        <RolesPermissionsTab
          roleSearch={roleSearch}
          onRoleSearchChange={setRoleSearch}
          roles={filteredRoles}
          selectedRole={selectedRole}
          permissionCatalog={permissionCatalog}
          loading={rolesLoading}
          error={rolesError}
          onSelectRole={setSelectedRoleId}
          onCreateRole={() => setCreateRoleOpen(true)}
          onRolesChanged={() => void loadRoles()}
          selectedRoleId={selectedRoleId}
        />
      )}

      <AddUserModal
        open={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        onSuccess={() => {
          void loadAdminUsers()
        }}
      />

      <CreateRoleModal
        open={createRoleOpen}
        onClose={() => setCreateRoleOpen(false)}
        permissions={permissionCatalog}
        catalogLoading={rolesLoading}
        onSuccess={(roleUuid) => {
          setSelectedRoleId(roleUuid)
          void loadRoles()
        }}
      />
    </div>
  )
}

function AdminUsersTab({
  search,
  onSearchChange,
  users,
  loading,
  error,
  page,
  totalPages,
  total,
  onPageChange,
}: {
  search: string
  onSearchChange: (value: string) => void
  users: AdminUser[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}) {
  return (
    <>
      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder="Search users..."
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <UserTable minWidth="720px">
        <thead className="sticky top-0 z-10 bg-violet-50/95 backdrop-blur-sm">
          <tr className="border-b border-violet-100">
            {['Role', 'Name', 'Email', 'Status', 'Actions'].map((col) => (
              <th
                key={col}
                className="px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="px-3 py-12 text-center text-sm text-muted-foreground">
                Loading admin users...
              </td>
            </tr>
          ) : users.length === 0 ? (
            <EmptyState colSpan={5} message="No admin users found" />
          ) : (
            users.map((user) => (
              <tr
                key={user.uuid}
                className="border-b border-violet-50 transition-colors last:border-0 hover:bg-violet-50/30"
              >
                <td className="px-3 py-2.5 text-xs text-foreground">
                  {user.role?.name ?? '—'}
                </td>
                <td className="px-3 py-2.5 text-xs font-semibold text-foreground">
                  {user.full_name}
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {user.email}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={normalizeStatus(user.status)} />
                </td>
                <td className="px-3 py-2.5">
                  <RowActions label={user.full_name} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </UserTable>

      {totalPages > 1 ? (
        <div className="flex shrink-0 items-center justify-between rounded-xl border border-violet-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs text-muted-foreground">
            Showing {users.length} of {total} admin users · Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border border-violet-100 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg border border-violet-100 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

function CustomerUsersTab({
  search,
  onSearchChange,
  users,
  loading,
  error,
  page,
  totalPages,
  total,
  onPageChange,
}: {
  search: string
  onSearchChange: (value: string) => void
  users: CustomerUser[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}) {
  return (
    <>
      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder="Search users..."
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <UserTable minWidth="880px">
        <thead className="sticky top-0 z-10 bg-violet-50/95 backdrop-blur-sm">
          <tr className="border-b border-violet-100">
            {['Image', 'Name', 'Email', 'Birth Date', 'Phone', 'Status', 'Actions'].map(
              (col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  {col}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="px-3 py-12 text-center text-sm text-muted-foreground">
                Loading customers...
              </td>
            </tr>
          ) : users.length === 0 ? (
            <EmptyState colSpan={7} message="No customers found" />
          ) : (
            users.map((user) => (
              <tr
                key={user.uuid}
                className="border-b border-violet-50 transition-colors last:border-0 hover:bg-violet-50/30"
              >
                <td className="px-3 py-2.5">
                  <UserAvatar user={user} />
                </td>
                <td className="px-3 py-2.5 text-xs font-semibold text-foreground">
                  {user.full_name}
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {user.email}
                </td>
                <td className="px-3 py-2.5 text-xs whitespace-nowrap text-foreground">
                  {formatBirthDate(user.birth_date)}
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {user.phone_number || 'N/A'}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={normalizeStatus(user.status)} />
                </td>
                <td className="px-3 py-2.5">
                  <CustomerRowActions user={user} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </UserTable>

      {totalPages > 1 ? (
        <div className="flex shrink-0 items-center justify-between rounded-xl border border-violet-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs text-muted-foreground">
            Showing {users.length} of {total} customers · Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border border-violet-100 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg border border-violet-100 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

function RolesPermissionsTab({
  roleSearch,
  onRoleSearchChange,
  roles,
  selectedRole,
  permissionCatalog,
  loading,
  error,
  onSelectRole,
  onCreateRole,
  onRolesChanged,
  selectedRoleId,
}: {
  roleSearch: string
  onRoleSearchChange: (value: string) => void
  roles: Role[]
  selectedRole: Role | null
  permissionCatalog: PermissionCatalogItem[]
  loading: boolean
  error: string | null
  onSelectRole: (id: string | null) => void
  onCreateRole: () => void
  onRolesChanged: () => void
  selectedRoleId: string | null
}) {
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteRole = async () => {
    if (!roleToDelete) return

    setDeleting(true)
    try {
      await roleService.deleteRole(roleToDelete.uuid)
      toast.success('Role deleted successfully.')
      if (selectedRoleId === roleToDelete.uuid) {
        onSelectRole(null)
      }
      setRoleToDelete(null)
      onRolesChanged()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete role.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 justify-end">
        <button
          type="button"
          onClick={onCreateRole}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-paec-violet px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-paec-violet-dark sm:text-sm"
        >
          <Plus className="size-3.5" />
          New Role
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-3 xl:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <SearchBar
            value={roleSearch}
            onChange={onRoleSearchChange}
            placeholder="Search roles..."
          />

          <UserTable minWidth="560px">
            <thead className="sticky top-0 z-10 bg-violet-50/95 backdrop-blur-sm">
              <tr className="border-b border-violet-100">
                {['Role', 'Code', 'Actions'].map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    Loading roles...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <EmptyState colSpan={3} message="No roles found" />
              ) : (
                roles.map((role) => {
                  const isSelected = selectedRole?.uuid === role.uuid
                  const moduleCount = countRoleModules(role, permissionCatalog)

                  return (
                    <tr
                      key={role.uuid}
                      onClick={() => onSelectRole(isSelected ? null : role.uuid)}
                      className={cn(
                        'cursor-pointer border-b border-violet-50 transition-colors last:border-0',
                        isSelected ? 'bg-violet-50/80' : 'hover:bg-violet-50/30',
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Hexagon className="size-3.5 shrink-0 text-paec-orange" />
                          <span className="text-xs font-semibold text-foreground">
                            {role.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {role.code}
                      </td>
                      <td className="px-3 py-2.5">
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <span className="text-xs text-muted-foreground">
                            {moduleCount} modules
                          </span>
                          <button
                            type="button"
                            onClick={() => setRoleToDelete(role)}
                            className="inline-flex size-7 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${role.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </UserTable>
        </div>

        <RoleDetailPanel role={selectedRole} permissionCatalog={permissionCatalog} />
      </div>

      <ConfirmModal
        open={roleToDelete !== null}
        title="Delete Role"
        message={
          roleToDelete
            ? `Are you sure you want to delete "${roleToDelete.name}"? This cannot be undone. Roles assigned to users cannot be deleted.`
            : ''
        }
        confirmLabel="Delete Role"
        variant="danger"
        loading={deleting}
        onClose={() => !deleting && setRoleToDelete(null)}
        onConfirm={() => void handleDeleteRole()}
      />
    </div>
  )
}

function RoleDetailPanel({
  role,
  permissionCatalog,
}: {
  role: Role | null
  permissionCatalog: PermissionCatalogItem[]
}) {
  if (!role) {
    return (
      <div className="flex min-h-[240px] flex-1 items-center justify-center rounded-xl border border-violet-100 bg-white p-6 shadow-sm xl:min-w-[320px] xl:max-w-[400px]">
        <div className="text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-violet-50">
            <Shield className="size-7 text-paec-violet/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Select a role to view and edit its permissions
          </p>
        </div>
      </div>
    )
  }

  const moduleCount = countRoleModules(role, permissionCatalog)
  const permissionLabels = getRolePermissionLabels(role, permissionCatalog)
  const catalogByCode = new Map(permissionCatalog.map((item) => [item.code, item]))
  const grants = (role.permission_grants ?? []).filter(
    (grant) => grant.available_access.length > 0,
  )

  const grouped = groupPermissionsByModule(
    grants
      .map((grant) => catalogByCode.get(grant.code))
      .filter((item): item is PermissionCatalogItem => Boolean(item)),
  )

  return (
    <div className="flex min-h-[240px] flex-1 flex-col overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm xl:min-w-[320px] xl:max-w-[400px]">
      <div className="shrink-0 border-b border-violet-100 px-4 py-3">
        <div className="flex items-start gap-2">
          <Hexagon className="mt-0.5 size-4 shrink-0 text-paec-orange" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground">{role.name}</h3>
            <p className="text-xs text-muted-foreground">{role.code}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <RoleTypeBadge type="admin" />
          <span className="text-xs text-muted-foreground">{moduleCount} modules</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <p className="mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          Permissions
        </p>
        {grouped.length === 0 && permissionLabels.length === 0 ? (
          <p className="text-xs text-muted-foreground">No permissions assigned</p>
        ) : grouped.length > 0 ? (
          <div className="space-y-3">
            {grouped.map(({ module, permissions }) => (
              <div key={module}>
                <p className="mb-1.5 text-[10px] font-bold tracking-wider text-paec-orange uppercase">
                  {module}
                </p>
                <ul className="space-y-1.5">
                  {permissions.map((permission) => (
                    <li
                      key={permission.uuid}
                      className="flex items-center gap-2 rounded-lg border border-violet-50 bg-violet-50/30 px-3 py-2"
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center rounded bg-paec-violet text-[10px] text-white">
                        ✓
                      </span>
                      <span className="text-xs text-foreground">{permission.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-2">
            {permissionLabels.map((permission) => (
              <li
                key={permission}
                className="flex items-center gap-2 rounded-lg border border-violet-50 bg-violet-50/30 px-3 py-2"
              >
                <span className="flex size-4 shrink-0 items-center justify-center rounded bg-paec-violet text-[10px] text-white">
                  ✓
                </span>
                <span className="text-xs text-foreground">{permission}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative shrink-0">
      <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClassName}
      />
    </div>
  )
}

function UserTable({
  minWidth,
  children,
}: {
  minWidth: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  )
}

function EmptyState({
  colSpan,
  message,
}: {
  colSpan: number
  message: string
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-12 text-center">
        <Users className="mx-auto mb-2 size-8 text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </td>
    </tr>
  )
}
