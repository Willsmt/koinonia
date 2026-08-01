import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../../api/client'
import { logout } from '../auth/authSlice'

export interface Membership {
  id: number
  user: number
  username: string
  role: 'member' | 'cell_leader' | 'network_leader' | 'pastor'
  role_display: string
  celula: number | null
  rede: number | null
  rede_efetiva: number | null
}

export interface Celula {
  id: number
  nome: string
  rede: number
  rede_display: string
}

export interface Rede {
  id: number
  nome: string
  cor: string
  cor_display: string
}

export interface DashboardStats {
  escopo: 'cell_leader' | 'network_leader' | 'pastor'
  total_membros: number
  membros_por_celula: { nome: string; total: number; rede_nome: string }[]
  posts_por_escopo: { global: number; rede: number; celula: number }
  posts_por_dia: { data: string; total: number }[]
  celula_mais_ativa: { nome: string; total: number } | null
}

interface ChurchState {
  myMembership: Membership | null
  membershipStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  celulas: Celula[]
  celulasStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  redes: Rede[]
  redesStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  allMemberships: Membership[]
  allMembershipsStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  createStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  createError: string | null
  createFieldErrors: Record<string, string[]> | null
  dashboard: DashboardStats | null
  dashboardStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
}

const initialState: ChurchState = {
  myMembership: null,
  membershipStatus: 'idle',
  celulas: [],
  celulasStatus: 'idle',
  redes: [],
  redesStatus: 'idle',
  allMemberships: [],
  allMembershipsStatus: 'idle',
  createStatus: 'idle',
  createError: null,
  createFieldErrors: null,
  dashboard: null,
  dashboardStatus: 'idle',
}

function extractList<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : data.results
}

export const fetchMyMembership = createAsyncThunk('church/fetchMyMembership', async (userId: number) => {
  const { data } = await client.get('/church/memberships/')
  const list = extractList<Membership>(data)
  return list.find((m) => m.user === userId) ?? null
})

export const fetchCelulas = createAsyncThunk('church/fetchCelulas', async () => {
  const { data } = await client.get('/church/celulas/')
  return extractList<Celula>(data)
})

export const fetchRedes = createAsyncThunk('church/fetchRedes', async () => {
  const { data } = await client.get('/church/redes/')
  return extractList<Rede>(data)
})

export const fetchAllMemberships = createAsyncThunk('church/fetchAllMemberships', async () => {
  const { data } = await client.get('/church/memberships/')
  return extractList<Membership>(data)
})

export const fetchDashboardStats = createAsyncThunk('church/fetchDashboardStats', async () => {
  const { data } = await client.get<DashboardStats>('/church/dashboard/')
  return data
})

export const createMembership = createAsyncThunk(
  'church/createMembership',
  async (payload: { user: number; role: string; celula?: number; rede?: number }, { rejectWithValue }) => {
    try {
      const { data } = await client.post('/church/memberships/', payload)
      return data as Membership
    } catch (err) {
      const axiosErr = err as { response?: { data?: unknown } }
      return rejectWithValue(axiosErr.response?.data)
    }
  },
)

export const deleteMembership = createAsyncThunk(
  'church/deleteMembership',
  async (id: number, { rejectWithValue }) => {
    try {
      await client.delete(`/church/memberships/${id}/`)
      return id
    } catch (err) {
      const axiosErr = err as { response?: { data?: unknown } }
      return rejectWithValue(axiosErr.response?.data)
    }
  },
)

const churchSlice = createSlice({
  name: 'church',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyMembership.pending, (state) => {
        state.membershipStatus = 'loading'
      })
      .addCase(fetchMyMembership.fulfilled, (state, action) => {
        state.membershipStatus = 'succeeded'
        state.myMembership = action.payload
      })
      .addCase(fetchMyMembership.rejected, (state) => {
        state.membershipStatus = 'failed'
      })
      .addCase(fetchCelulas.pending, (state) => {
        state.celulasStatus = 'loading'
      })
      .addCase(fetchCelulas.fulfilled, (state, action) => {
        state.celulasStatus = 'succeeded'
        state.celulas = action.payload
      })
      .addCase(fetchCelulas.rejected, (state) => {
        state.celulasStatus = 'failed'
      })
      .addCase(fetchRedes.pending, (state) => {
        state.redesStatus = 'loading'
      })
      .addCase(fetchRedes.fulfilled, (state, action) => {
        state.redesStatus = 'succeeded'
        state.redes = action.payload
      })
      .addCase(fetchRedes.rejected, (state) => {
        state.redesStatus = 'failed'
      })
      .addCase(fetchAllMemberships.pending, (state) => {
        state.allMembershipsStatus = 'loading'
      })
      .addCase(fetchAllMemberships.fulfilled, (state, action) => {
        state.allMembershipsStatus = 'succeeded'
        state.allMemberships = action.payload
      })
      .addCase(fetchAllMemberships.rejected, (state) => {
        state.allMembershipsStatus = 'failed'
      })
      .addCase(fetchDashboardStats.pending, (state) => {
        state.dashboardStatus = 'loading'
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardStatus = 'succeeded'
        state.dashboard = action.payload
      })
      .addCase(fetchDashboardStats.rejected, (state) => {
        state.dashboardStatus = 'failed'
      })
      .addCase(createMembership.pending, (state) => {
        state.createStatus = 'loading'
        state.createError = null
        state.createFieldErrors = null
      })
      .addCase(createMembership.fulfilled, (state, action) => {
        state.createStatus = 'succeeded'
        state.allMemberships = [...state.allMemberships, action.payload]
      })
      .addCase(createMembership.rejected, (state, action) => {
        state.createStatus = 'failed'
        const payload = action.payload
        if (payload && typeof payload === 'object') {
          state.createFieldErrors = payload as Record<string, string[]>
          state.createError = 'Não foi possível atribuir.'
        } else {
          state.createError = 'Erro de conexão com o servidor.'
        }
      })
      .addCase(deleteMembership.fulfilled, (state, action) => {
        state.allMemberships = state.allMemberships.filter((m) => m.id !== action.payload)
      })
      .addCase(logout, () => initialState)
  },
})

export default churchSlice.reducer
