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

interface ChurchState {
  myMembership: Membership | null
  membershipStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  celulas: Celula[]
  celulasStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  redes: Rede[]
  redesStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
}

const initialState: ChurchState = {
  myMembership: null,
  membershipStatus: 'idle',
  celulas: [],
  celulasStatus: 'idle',
  redes: [],
  redesStatus: 'idle',
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
      // a Membership é por usuário — troca de conta sem isso mantinha o role antigo
      .addCase(logout, () => initialState)
  },
})

export default churchSlice.reducer
