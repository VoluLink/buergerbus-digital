export type CreateUserForm = {
  roleId: string
  initiativeId: string
  name: string
  email: string
  password: string
}

export type CreateUserPayload = {
  name: string
  email: string
  password: string
  roleId: number
  initiativeId: number
}

export type PendingAdminConfirmation =
  | {
      kind: 'existing-user'
      userId: number
      userName: string
      nextRoles: string[]
      nextActiveRole: string
      previousRoles: string[]
      previousActiveRole: string | null
    }
  | {
      kind: 'new-user'
      userName: string
      email: string
      roleId: number
      initiativeId: number
      password: string
    }

export type ReloadUsersOverrides = {
  page?: number
  pageSize?: number
  searchQuery?: string
}
