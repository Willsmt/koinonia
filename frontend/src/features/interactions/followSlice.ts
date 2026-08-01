import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../../api/client'
import { logout } from '../auth/authSlice'

interface FollowItem {
  id: number
  follower: number
  followed: number
  created_at: string
}

interface FollowState {
  followingIds: Record<number, number> // followedUserId -> id do registro de Follow
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
}

const initialState: FollowState = { followingIds: {}, status: 'idle' }

export const fetchMyFollowing = createAsyncThunk('follow/fetchMyFollowing', async () => {
  const { data } = await client.get<{ results: FollowItem[] }>('/interactions/follows/')
  const map: Record<number, number> = {}
  data.results.forEach((f) => {
    map[f.followed] = f.id
  })
  return map
})

export const toggleFollow = createAsyncThunk(
  'follow/toggleFollow',
  async (followedUserId: number, { getState, rejectWithValue }) => {
    const state = getState() as { follow: FollowState }
    const existingId = state.follow.followingIds[followedUserId]
    try {
      if (existingId) {
        await client.delete(`/interactions/follows/${existingId}/`)
        return { followedUserId, followId: null as number | null }
      }
      const { data } = await client.post<FollowItem>('/interactions/follows/', { followed: followedUserId })
      return { followedUserId, followId: data.id as number | null }
    } catch (err) {
      const axiosErr = err as { response?: { data?: unknown } }
      return rejectWithValue(axiosErr.response?.data)
    }
  },
)

const followSlice = createSlice({
  name: 'follow',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyFollowing.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchMyFollowing.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.followingIds = action.payload
      })
      .addCase(fetchMyFollowing.rejected, (state) => {
        state.status = 'failed'
      })
      .addCase(toggleFollow.fulfilled, (state, action) => {
        if (action.payload.followId) {
          state.followingIds[action.payload.followedUserId] = action.payload.followId
        } else {
          delete state.followingIds[action.payload.followedUserId]
        }
      })
      .addCase(logout, () => initialState)
  },
})

export default followSlice.reducer
