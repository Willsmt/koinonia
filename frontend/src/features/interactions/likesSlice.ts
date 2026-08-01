import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../../api/client'
import { logout } from '../auth/authSlice'

interface LikeInfo {
  count: number
  likedByMe: boolean
  myLikeId: number | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
}

interface LikesState {
  byPost: Record<number, LikeInfo>
}

const initialState: LikesState = { byPost: {} }

interface LikeApiItem {
  id: number
  post: number
  user: number
  created_at: string
}
interface LikeListResponse {
  count: number
  results: LikeApiItem[]
}

// Só olha a 1ª página pra descobrir "eu curti?" — se um post tiver mais de
// PAGE_SIZE curtidas e a minha não estiver entre as primeiras, o botão pode
// mostrar estado errado. Aceitável pro volume deste projeto; documentado.
export const fetchLikes = createAsyncThunk(
  'likes/fetchLikes',
  async ({ postId, myUserId }: { postId: number; myUserId: number }) => {
    const { data } = await client.get<LikeListResponse>(`/interactions/likes/?post=${postId}`)
    const mine = data.results.find((l) => l.user === myUserId)
    return { postId, count: data.count, likedByMe: Boolean(mine), myLikeId: mine?.id ?? null }
  },
)

export const toggleLike = createAsyncThunk(
  'likes/toggleLike',
  async ({ postId }: { postId: number }, { getState, rejectWithValue }) => {
    const state = getState() as { likes: LikesState }
    const current = state.likes.byPost[postId]
    try {
      if (current?.likedByMe && current.myLikeId) {
        await client.delete(`/interactions/likes/${current.myLikeId}/`)
        return { postId, count: current.count - 1, likedByMe: false, myLikeId: null }
      }
      const { data } = await client.post<LikeApiItem>('/interactions/likes/', { post: postId })
      return { postId, count: (current?.count ?? 0) + 1, likedByMe: true, myLikeId: data.id }
    } catch (err) {
      const axiosErr = err as { response?: { data?: unknown } }
      return rejectWithValue(axiosErr.response?.data)
    }
  },
)

const likesSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLikes.pending, (state, action) => {
        const { postId } = action.meta.arg
        state.byPost[postId] = state.byPost[postId] ?? {
          count: 0,
          likedByMe: false,
          myLikeId: null,
          status: 'loading',
        }
        state.byPost[postId].status = 'loading'
      })
      .addCase(fetchLikes.fulfilled, (state, action) => {
        state.byPost[action.payload.postId] = { ...action.payload, status: 'succeeded' }
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        state.byPost[action.payload.postId] = { ...action.payload, status: 'succeeded' }
      })
      .addCase(logout, () => initialState)
  },
})

export default likesSlice.reducer
