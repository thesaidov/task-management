// src/types/index.ts

export interface User {
  id: string
  name: string
  email: string
}

export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED"

export interface Friendship {
  id: string
  senderId: string
  receiverId: string
  status: FriendshipStatus
  createdAt: Date
  updatedAt: Date
  sender: User
  receiver: User
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: string
  addedAt: Date
  user: User
}

export interface Project {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  userId: string
  _count?: {
    tasks: number
  }
  tasks?: Task[]
  members?: ProjectMember[]
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: Date | null
  createdAt: Date
  updatedAt: Date
  projectId: string
  assignedToId: string | null
  assignedTo?: User
  project?: {
    id: string
    name: string
    userId: string
  }
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE"
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH"

export interface CreateProjectInput {
  name: string
  description?: string
}

export interface UpdateProjectInput {
  name: string
  description?: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string
  projectId: string
  assignedToId?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string | null
  assignedToId?: string | null
}