export interface LoginCredentials {
  email: string
  password: string
}

export type LoginErrors = Partial<Record<keyof LoginCredentials, string>>

export interface LoginResponse {
  success: boolean
  message: string
  email: string
}