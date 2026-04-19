import type { AppStore } from '../store/index'
import { authApi } from './auth'
import { logout, setSession } from '../store/auth/auth.slice'
import { http } from './http'

type RetriableRequestConfig = {
  _retry?: boolean
  url?: string
  headers?: Record<string, string>
}

export function setupInterceptors(store: AppStore) {
  let isRefreshing = false
  let refreshPromise: Promise<{ accessToken: string; user: { id: string; email: string } }> | null = null

  // Request: attach fresh token before every request
  http.interceptors.request.use((config) => {
    const token = store.getState().auth.token
    const requestUrl = config.url ?? ''
    const isRefreshRequest = requestUrl.includes('/auth/refresh')

    if (token && !isRefreshRequest) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Response: auto-logout on 401 (expired or invalid token)
  http.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      const originalRequest = (error as { config?: RetriableRequestConfig })?.config
      const requestUrl = originalRequest?.url ?? ''
      const isRefreshRequest = requestUrl.includes('/auth/refresh')

      if (status === 401 && originalRequest && !originalRequest._retry && !isRefreshRequest) {
        originalRequest._retry = true

        // Collapse parallel 401s into one refresh request so several failing API calls do not refresh at once.
        if (!isRefreshing) {
          isRefreshing = true
          refreshPromise = authApi.refresh().finally(() => {
            isRefreshing = false
          })
        }

        return refreshPromise
          ?.then((session) => {
            store.dispatch(setSession({ accessToken: session.accessToken, user: session.user }))
            if (!originalRequest.headers) {
              originalRequest.headers = {}
            }
            // Replay the original request with the fresh access token after refresh succeeds.
            originalRequest.headers.Authorization = `Bearer ${session.accessToken}`
            return http(originalRequest)
          })
          .catch(() => {
            store.dispatch(logout())
            window.location.replace('/login')
            return Promise.reject(error)
          })
      }

      return Promise.reject(error)
    },
  )
}
