import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../../api/client'
import { logout } from '../auth/authSlice'

export interface NotificationItem {
  id: number
  actor: number
  actor_nome: string
  tipo: 'follow' | 'like' | 'comment'
  tipo_display: string
  post: number | null
  lida: boolean
  created_at: string
}

interface NotificationsState {
  items: NotificationItem[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
}

const initialState: NotificationsState = { items: [], status: 'idle' }

export const fetchNotifications = createAsyncThunk('notifications/fetchNotifications', async () => {
  const { data } = await client.get<{ results: NotificationItem[] } | NotificationItem[]>(
    '/interactions/notifications/',
  )
  return Array.isArray(data) ? data : data.results
})

export const markAsRead = createAsyncThunk('notifications/markAsRead', async (id: number) => {
  const { data } = await client.patch<NotificationItem>(`/interactions/notifications/${id}/`, { lida: true })
  return data
})

export const markAllRead = createAsyncThunk('notifications/markAllRead', async () => {
  await client.patch('/interactions/notifications/marcar_tudo_lido/')
})

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.status = 'failed'
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const idx = state.items.findIndex((n) => n.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, lida: true }))
      })
      .addCase(logout, () => initialState)
  },
})

export default notificationsSlice.reducer
