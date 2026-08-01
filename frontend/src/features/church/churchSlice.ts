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
  createMembershipStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  createMembershipError: string | null
  createMembershipFieldErrors: Record<string, string[]> | null
  createRedeStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  createRedeError: string | null
  createRedeFieldErrors: Record<string, string[]> | null
  createCelulaStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  createCelulaError: string | null
  createCelulaFieldErrors: Record<string, string[]> | null
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
  createMembershipStatus: 'idle',
  createMembershipError: null,
  createMembershipFieldErrors: null,
  createRedeStatus: 'idle',
  createRedeError: null,
  createRedeFieldErrors: null,
  createCelulaStatus: 'idle',
  createCelulaError: null,
  createCelulaFieldErrors: null,
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

export const createRede = createAsyncThunk(
  'church/createRede',
  async (payload: { nome: string; cor: string }, { rejectWithValue }) => {
    try {
      const { data } = await client.post('/church/redes/', payload)
      return data as Rede
    } catch (err) {
      const axiosErr = err as { response?: { data?: unknown } }
      return rejectWithValue(axiosErr.response?.data)
    }
  },
)

export const createCelula = createAsyncThunk(
  'church/createCelula',
  async (payload: { nome: string; rede: number }, { rejectWithValue }) => {
    try {
      const { data } = await client.post('/church/celulas/', payload)
      return data as Celula
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
        state.createMembershipStatus = 'loading'
        state.createMembershipError = null
        state.createMembershipFieldErrors = null
      })
      .addCase(createMembership.fulfilled, (state, action) => {
        state.createMembershipStatus = 'succeeded'
        state.allMemberships = [...state.allMemberships, action.payload]
      })
      .addCase(createMembership.rejected, (state, action) => {
        state.createMembershipStatus = 'failed'
        const payload = action.payload
        if (payload && typeof payload === 'object') {
          state.createMembershipFieldErrors = payload as Record<string, string[]>
          state.createMembershipError = 'Não foi possível atribuir.'
        } else {
          state.createMembershipError = 'Erro de conexão com o servidor.'
        }
      })
      .addCase(deleteMembership.fulfilled, (state, action) => {
        state.allMemberships = state.allMemberships.filter((m) => m.id !== action.payload)
      })
      .addCase(createRede.pending, (state) => {
        state.createRedeStatus = 'loading'
        state.createRedeError = null
        state.createRedeFieldErrors = null
      })
      .addCase(createRede.fulfilled, (state, action) => {
        state.createRedeStatus = 'succeeded'
        state.redes = [...state.redes, action.payload]
      })
      .addCase(createRede.rejected, (state, action) => {
        state.createRedeStatus = 'failed'
        const payload = action.payload
        if (payload && typeof payload === 'object') {
          state.createRedeFieldErrors = payload as Record<string, string[]>
          state.createRedeError = 'Não foi possível criar a rede.'
        } else {
          state.createRedeError = 'Erro de conexão com o servidor.'
        }
      })
      .addCase(createCelula.pending, (state) => {
        state.createCelulaStatus = 'loading'
        state.createCelulaError = null
        state.createCelulaFieldErrors = null
      })
      .addCase(createCelula.fulfilled, (state, action) => {
        state.createCelulaStatus = 'succeeded'
        state.celulas = [...state.celulas, action.payload]
      })
      .addCase(createCelula.rejected, (state, action) => {
        state.createCelulaStatus = 'failed'
        const payload = action.payload
        if (payload && typeof payload === 'object') {
          state.createCelulaFieldErrors = payload as Record<string, string[]>
          state.createCelulaError = 'Não foi possível criar a célula.'
        } else {
          state.createCelulaError = 'Erro de conexão com o servidor.'
        }
      })
      .addCase(logout, () => initialState)
  },
})

export default churchSlice.reducer
