export const MIN_PASSWORD_LENGTH = 6

export function isPasswordLongEnough(password: string): boolean {
  return password.trim().length >= MIN_PASSWORD_LENGTH
}