export type UserStatus = 'active' | 'inactive'

export type AdminStaffUser = {
  id: string
  role: string
  name: string
  email: string
  status: UserStatus
}

export type CustomerUser = {
  id: string
  name: string
  email: string
  initials: string
  birthDate: string
  phone: string | null
  status: UserStatus
}

export type RoleType = 'admin' | 'customer'

export type AdminRole = {
  id: string
  name: string
  code: string
  type: RoleType
  moduleCount: number
  permissions: string[]
}

export const mockAdminStaffUsers: AdminStaffUser[] = [
  {
    id: '1',
    role: 'Superadmin',
    name: 'Super Admin',
    email: 'admin@paec.com',
    status: 'active',
  },
  {
    id: '2',
    role: 'Admin',
    name: 'Main Admin',
    email: 'mainadmin@ticketoc.com',
    status: 'active',
  },
  {
    id: '3',
    role: 'Editor',
    name: 'Editor',
    email: 'editor@ticketoc.com',
    status: 'active',
  },
  {
    id: '4',
    role: 'Marketing Team',
    name: 'Marketing Team',
    email: 'marketing@ticketoc.com',
    status: 'inactive',
  },
  {
    id: '5',
    role: 'Support Admin',
    name: 'Support Admin',
    email: 'support@ticketoc.com',
    status: 'active',
  },
  {
    id: '6',
    role: 'Finance Admin',
    name: 'Finance Admin',
    email: 'finance@ticketoc.com',
    status: 'active',
  },
]

export const mockCustomerUsers: CustomerUser[] = [
  {
    id: '1',
    name: 'Yelena Du',
    email: 'yelenadu@gmail.com',
    initials: 'YD',
    birthDate: '05/08/1999',
    phone: null,
    status: 'active',
  },
  {
    id: '2',
    name: 'Ysmael Ten',
    email: 'ysmaelten@gmail.com',
    initials: 'YT',
    birthDate: '05/14/1996',
    phone: null,
    status: 'active',
  },
  {
    id: '3',
    name: 'John Vincent Cerdeño',
    email: 'johnvincent.cerdeno@gmail.com',
    initials: 'JV',
    birthDate: '03/22/1998',
    phone: '+63 917 555 1234',
    status: 'active',
  },
  {
    id: '4',
    name: 'Maria Santos',
    email: 'maria.santos@gmail.com',
    initials: 'MS',
    birthDate: '11/03/2001',
    phone: '+63 918 234 5678',
    status: 'active',
  },
  {
    id: '5',
    name: 'Carlos Reyes',
    email: 'carlos.reyes@gmail.com',
    initials: 'CR',
    birthDate: '07/19/1995',
    phone: '+63 919 876 5432',
    status: 'inactive',
  },
  {
    id: '6',
    name: 'Anna Lopez',
    email: 'anna.lopez@gmail.com',
    initials: 'AL',
    birthDate: '01/30/2000',
    phone: null,
    status: 'active',
  },
]

const adminPermissions = [
  'Dashboard',
  'Transactions',
  'Activities',
  'Promo Codes',
  'User Management',
  'Intelligence',
  'Reports',
  'Settings',
]

const customerPermissions = [
  'My Tickets',
  'Coupons',
  'Transactions',
  'Inquiries',
  'Profile',
]

export const mockAdminRoles: AdminRole[] = [
  {
    id: '1',
    name: 'Superadmin',
    code: 'superadmin',
    type: 'admin',
    moduleCount: 36,
    permissions: [
      ...adminPermissions,
      'Role Management',
      'Audit Logs',
      'System Config',
      'Billing',
      'API Access',
    ],
  },
  {
    id: '2',
    name: 'Admin',
    code: 'admin',
    type: 'admin',
    moduleCount: 34,
    permissions: [...adminPermissions, 'Role Management', 'Audit Logs'],
  },
  {
    id: '3',
    name: 'Editor',
    code: 'editor',
    type: 'admin',
    moduleCount: 20,
    permissions: ['Dashboard', 'Activities', 'Promo Codes', 'Reports'],
  },
  {
    id: '4',
    name: 'Accounting Admin',
    code: 'accountingadmin',
    type: 'admin',
    moduleCount: 8,
    permissions: ['Dashboard', 'Transactions', 'Reports', 'Billing'],
  },
  {
    id: '5',
    name: 'Marketing Admin',
    code: 'marketingadmin',
    type: 'admin',
    moduleCount: 9,
    permissions: ['Dashboard', 'Promo Codes', 'Activities', 'Intelligence'],
  },
  {
    id: '6',
    name: 'Marketing Team',
    code: 'marketingteam',
    type: 'admin',
    moduleCount: 19,
    permissions: ['Dashboard', 'Promo Codes', 'Activities', 'Reports'],
  },
  {
    id: '7',
    name: 'Finance Admin',
    code: 'financeadmin',
    type: 'admin',
    moduleCount: 17,
    permissions: ['Dashboard', 'Transactions', 'Reports', 'Billing'],
  },
  {
    id: '8',
    name: 'Support Admin',
    code: 'supportadmin',
    type: 'admin',
    moduleCount: 17,
    permissions: ['Dashboard', 'Transactions', 'User Management', 'Inquiries'],
  },
  {
    id: '9',
    name: 'Customer',
    code: 'customer',
    type: 'customer',
    moduleCount: 5,
    permissions: customerPermissions,
  },
]
