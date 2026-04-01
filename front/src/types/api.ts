export type AuthResponse = {
  token: string
  tokenType: string
  expiresAt: string
  user: {
    id: number
    username: string
    email: string
    fullName: string | null
  }
}

export type UserProfile = {
  id: number
  username: string
  email: string
  fullName: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type Project = {
  id: number
  ownerUserId: number
  name: string
  projectKey: string
  description: string | null
  createdAt: string
  updatedAt: string
}