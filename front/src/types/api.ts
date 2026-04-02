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

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED'

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type Task = {
  id: number
  projectId: number
  reporterUserId: number
  assigneeUserId: number | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export type TaskComment = {
  id: number
  taskId: number
  authorUserId: number
  content: string
  createdAt: string
  updatedAt: string
}