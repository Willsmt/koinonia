import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import client from '../../api/client'

interface AuthState {
  token: string | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  fieldErrors: Record<string, string[]> | null
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  status: 'idle',
  error: null,
  fieldErrors: null,
}

interface Credentials {
  username: string
  password: string
}

interface RegisterData {
  username: string
  password: string
  email: string
  nome: string
  apelido?: string
  telefone?: string
}

function parseAuthError(payload: unknown): { fieldErrors: Record<string, string[]>; message: string } {
  if (payload && typeof payload === 'object') {
    const fieldErrors = payload as Record<string, string[]>
    const nonField = fieldErrors.non_field_errors ?? (fieldErrors as unknown as { detail?: string }).detail
    const message = Array.isArray(nonField)
      ? nonField[0]
      : typeof nonField === 'string'
        ? nonField
        : 'Não foi possível completar a operação.'
    return { fieldErrors, message }
  }
  return { fieldErrors: {}, message: 'Erro de conexão com o servidor.' }
}

export const login = createAsyncThunk('auth/login', async (credentials: Credentials, { rejectWithValue }) => {
  try {
    const { data } = await client.post('/accounts/login/', credentials)
    return data.token as string
  } catch (err) {
    const axiosErr = err as { response?: { data?: unknown } }
    return rejectWithValue(axiosErr.response?.data)
  }
})

export const register = createAsyncThunk('auth/register', async (payload: RegisterData, { rejectWithValue }) => {
  try {
    await client.post('/accounts/register/', payload)
    const { data } = await client.post('/accounts/login/', {
      username: payload.username,
      password: payload.password,
    })
    return data.token as string
  } catch (err) {
    const axiosErr = err as { response?: { data?: unknown } }
    return rejectWithValue(axiosErr.response?.data)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null
      localStorage.removeItem('token')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
        state.fieldErrors = null
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = 'succeeded'
        state.token = action.payload
        localStorage.setItem('token', action.payload)
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        const { fieldErrors, message } = parseAuthError(action.payload)
        state.fieldErrors = fieldErrors
        state.error = message
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading'
        state.error = null
        state.fieldErrors = null
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = 'succeeded'
        state.token = action.payload
        localStorage.setItem('token', action.payload)
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed'
        const { fieldErrors, message } = parseAuthError(action.payload)
        state.fieldErrors = fieldErrors
        state.error = message
      })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
