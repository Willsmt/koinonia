import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../../api/client'
import { logout } from '../auth/authSlice'

export interface PublicUser {
  id: number
  username: string
  nome_exibicao: string
  cor: string | null
  foto: string | null
  bio: string
  date_joined: string
}

interface PeopleState {
  results: PublicUser[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  viewedUser: PublicUser | null
  viewedUserStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
}

const initialState: PeopleState = { results: [], status: 'idle', viewedUser: null, viewedUserStatus: 'idle' }

export const searchUsers = createAsyncThunk('people/searchUsers', async (search: string) => {
  const { data } = await client.get<{ results: PublicUser[] } | PublicUser[]>(
    `/accounts/users/${search ? `?search=${encodeURIComponent(search)}` : ''}`,
  )
  return Array.isArray(data) ? data : data.results
})

export const fetchUserDetail = createAsyncThunk('people/fetchUserDetail', async (id: number) => {
  const { data } = await client.get<PublicUser>(`/accounts/users/${id}/`)
  return data
})

const peopleSlice = createSlice({
  name: 'people',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(searchUsers.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.results = action.payload
      })
      .addCase(searchUsers.rejected, (state) => {
        state.status = 'failed'
      })
      .addCase(fetchUserDetail.pending, (state) => {
        state.viewedUserStatus = 'loading'
        state.viewedUser = null
      })
      .addCase(fetchUserDetail.fulfilled, (state, action) => {
        state.viewedUserStatus = 'succeeded'
        state.viewedUser = action.payload
      })
      .addCase(fetchUserDetail.rejected, (state) => {
        state.viewedUserStatus = 'failed'
      })
      .addCase(logout, () => initialState)
  },
})

export default peopleSlice.reducer
