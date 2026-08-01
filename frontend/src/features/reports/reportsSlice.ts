import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../../api/client'
import { logout } from '../auth/authSlice'

export interface BugReportItem {
  id: number
  reporter: number
  reporter_username: string
  descricao: string
  imagem: string | null
  pagina: string
  resolvido: boolean
  created_at: string
}

interface ReportsState {
  createStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  createError: string | null
  createFieldErrors: Record<string, string[]> | null
  list: BugReportItem[]
  listStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
}

const initialState: ReportsState = {
  createStatus: 'idle',
  createError: null,
  createFieldErrors: null,
  list: [],
  listStatus: 'idle',
}

export const fetchBugReports = createAsyncThunk('reports/fetchBugReports', async () => {
  const { data } = await client.get<{ results: BugReportItem[] } | BugReportItem[]>('/reports/bug-reports/')
  return Array.isArray(data) ? data : data.results
})

export const toggleResolvido = createAsyncThunk(
  'reports/toggleResolvido',
  async ({ id, resolvido }: { id: number; resolvido: boolean }) => {
    const { data } = await client.patch<BugReportItem>(`/reports/bug-reports/${id}/`, { resolvido })
    return data
  },
)

export const deleteBugReport = createAsyncThunk('reports/deleteBugReport', async (id: number) => {
  await client.delete(`/reports/bug-reports/${id}/`)
  return id
})

export const createBugReport = createAsyncThunk(
  'reports/createBugReport',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      await client.post('/reports/bug-reports/', formData)
      return true
    } catch (err) {
      const axiosErr = err as { response?: { data?: unknown } }
      return rejectWithValue(axiosErr.response?.data)
    }
  },
)

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    resetCreateStatus(state) {
      state.createStatus = 'idle'
      state.createError = null
      state.createFieldErrors = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBugReports.pending, (state) => {
        state.listStatus = 'loading'
      })
      .addCase(fetchBugReports.fulfilled, (state, action) => {
        state.listStatus = 'succeeded'
        state.list = action.payload
      })
      .addCase(fetchBugReports.rejected, (state) => {
        state.listStatus = 'failed'
      })
      .addCase(toggleResolvido.fulfilled, (state, action) => {
        const idx = state.list.findIndex((r) => r.id === action.payload.id)
        if (idx !== -1) state.list[idx] = action.payload
      })
      .addCase(deleteBugReport.fulfilled, (state, action) => {
        state.list = state.list.filter((r) => r.id !== action.payload)
      })
      .addCase(createBugReport.pending, (state) => {
        state.createStatus = 'loading'
        state.createError = null
        state.createFieldErrors = null
      })
      .addCase(createBugReport.fulfilled, (state) => {
        state.createStatus = 'succeeded'
      })
      .addCase(createBugReport.rejected, (state, action) => {
        state.createStatus = 'failed'
        const payload = action.payload
        if (payload && typeof payload === 'object') {
          state.createFieldErrors = payload as Record<string, string[]>
          state.createError = 'Não foi possível enviar o relato.'
        } else {
          state.createError = 'Erro de conexão com o servidor.'
        }
      })
      .addCase(logout, () => initialState)
  },
})

export const { resetCreateStatus } = reportsSlice.actions
export default reportsSlice.reducer
