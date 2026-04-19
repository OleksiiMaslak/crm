import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import i18n from '../../i18n'
import { authApi } from '../../api/auth'
import type { RootState } from '../index'

interface User {
  id: string
  email: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const TOKEN_KEY = 'crm_access_token'
const USER_KEY = 'crm_user'

function loadFromStorage(): Pick<AuthState, 'user' | 'token' | 'isAuthenticated'> {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = localStorage.getItem(USER_KEY)
    if (token && user) {
      return { token, user: JSON.parse(user) as User, isAuthenticated: true }
    }
  } catch {
    // corrupted storage — ignore
  }
  return { token: null, user: null, isAuthenticated: false }
}

const initialState: AuthState = {
  ...loadFromStorage(),
  isLoading: false,
  error: null,
}

export const register = createAsyncThunk(
  'auth/register',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      return await authApi.register(payload)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        i18n.t('errors.auth.registrationFailed')
      return rejectWithValue(Array.isArray(message) ? message.join(', ') : message)
    }
  },
)

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      return await authApi.login(payload)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        i18n.t('errors.auth.loginFailed')
      return rejectWithValue(Array.isArray(message) ? message.join(', ') : message)
    }
  },
)

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      return await authApi.refresh(state.auth.token ?? undefined)
    } catch {
      return rejectWithValue(i18n.t('errors.auth.sessionRestoreFailed'))
    }
  },
)

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    try {
      await authApi.logout()
    } catch {
      // Local logout still happens even if server cookie clear fails
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(
      state,
      action: { payload: { accessToken: string; user: User } },
    ) {
      state.user = action.payload.user
      state.token = action.payload.accessToken
      state.isAuthenticated = true
      state.error = null
      localStorage.setItem(TOKEN_KEY, action.payload.accessToken)
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user))
    },
    logout(state) {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: AuthState) => {
      state.isLoading = true
      state.error = null
    }

    const handleFulfilled = (
      state: AuthState,
      action: { payload: { accessToken: string; user: User } },
    ) => {
      state.isLoading = false
      state.user = action.payload.user
      state.token = action.payload.accessToken
      state.isAuthenticated = true
      localStorage.setItem(TOKEN_KEY, action.payload.accessToken)
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user))
    }

    const handleRejected = (
      state: AuthState,
      action: { payload: unknown },
    ) => {
      state.isLoading = false
      state.error = (action.payload as string) ?? i18n.t('errors.auth.unknown')
    }

    builder
      .addCase(register.pending, handlePending)
      .addCase(register.fulfilled, handleFulfilled)
      .addCase(register.rejected, handleRejected)
      .addCase(login.pending, handlePending)
      .addCase(login.fulfilled, handleFulfilled)
      .addCase(login.rejected, handleRejected)
      .addCase(restoreSession.pending, (state) => {
        state.isLoading = true
      })
      .addCase(restoreSession.fulfilled, handleFulfilled)
      .addCase(restoreSession.rejected, (state) => {
        state.isLoading = false
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      })
  },
})

export const { setSession, logout, clearError } = authSlice.actions
export default authSlice.reducer
