export type ProjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  projectsInProgress: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: { field?: string; message: string }[];
  };
}
