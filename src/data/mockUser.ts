export type User = {
  id: string
  name: string
  email: string
  initials: string
  badge: string
  levelProgress: number
}

export const mockUser: User = {
  id: '1',
  name: 'John Vincent Cerdeño',
  email: 'johnvincent.cerdeno@gmail.com',
  initials: 'JV',
  badge: 'Member',
  levelProgress: 35,
}
