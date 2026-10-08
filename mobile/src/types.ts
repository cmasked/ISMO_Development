export type ProjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export interface User { id: string; fullName: string; email: string; createdAt: string; updatedAt: string }
export interface Project {
  id: string; ownerId: string; name: string; description: string | null; status: ProjectStatus;
  startDate: string | null; endDate: string | null; createdAt: string; updatedAt: string;
}
export interface Task {
  id: string; projectId: string; name: string; description: string | null; priority: Priority;
  status: TaskStatus; dueDate: string | null; createdAt: string; updatedAt: string;
}
export interface Dashboard { totalProjects: number; totalTasks: number; completedTasks: number; pendingTasks: number; projectsInProgress: number }
export interface Session { accessToken: string; expiresAt: string; user: User }
export type ProjectInput = Pick<Project, 'name' | 'description' | 'status' | 'startDate' | 'endDate'>;
export type TaskInput = Pick<Task, 'name' | 'description' | 'priority' | 'status' | 'dueDate' | 'projectId'>;
export const projectStatuses: ProjectStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
export const taskStatuses: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
export const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];
export const labels: Record<ProjectStatus | TaskStatus | Priority, string> = {
  NOT_STARTED: 'Not started', IN_PROGRESS: 'In progress', COMPLETED: 'Completed',
  PENDING: 'Pending', LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High',
};

export type RootStackParams = { Home: undefined; ProjectDetails: { id: string }; ProjectForm: { id?: string } | undefined; TaskForm: { id?: string; projectId?: string } | undefined };
