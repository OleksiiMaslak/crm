import { http } from './http'

export interface Repository {
  id: string
  userId: string
  owner: string
  name: string
  url: string
  description?: string
  language?: string
  stars: number
  forks: number
  openIssues: number
  createdAtUtcUnix: number
}

export const repositoriesApi = {
  getAll: () => http.get<Repository[]>('/repositories').then((r) => r.data),

  create: (owner: string, name: string) =>
    http.post<Repository>('/repositories', { owner, name }).then((r) => r.data),

  remove: (id: string) =>
    http.delete<{ success: boolean }>(`/repositories/${id}`).then((r) => r.data),

  refresh: (id: string) =>
    http.patch<Repository>(`/repositories/${id}/refresh`).then((r) => r.data),
}
