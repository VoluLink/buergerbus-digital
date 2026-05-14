import type { UserProfile } from '../types/UserProfile'

const mockProfile: UserProfile = {
  name: 'Julia Admin',
  role: 'Admin',
  email: 'julia.admin@buergerbus.de',
}

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs)
  })
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  await wait(200)
  return mockProfile
}