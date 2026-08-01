import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../../api/client'
import { logout } from '../auth/authSlice'

export interface Post {
  id: number
  author: number
  author_nome: string
  escopo: 'celula' | 'rede' | 'global'
  celula: number | null
  rede: number | null
  posted_as: number | null
  conteudo: string
  created_at: string
}

type FeedName = 'global' | 'celula' | 'rede'

interface FeedState {
  items: Post[]
  next: string | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

interface ListState {
  items: Post[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

interface PostsState {
  feeds: Record<FeedName, FeedState>
  allReadable: ListState
  createStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  createError: string | null
  createFieldErrors: Record<string, string[]> | null
}

function emptyFeed(): FeedState {
  return { items: [], next: null, status: 'idle', error: null }
}

const initialState: PostsState = {
  feeds: { global: emptyFeed(), celula: emptyFeed(), rede: emptyFeed() },
  allReadable: { items: [], status: 'idle', error: null },
  createStatus: 'idle',
  createError: null,
  createFieldErrors: null,
}

interface FetchFeedArgs {
  feed: FeedName
  url?: string
}

interface FeedResponse {
  next: string | null
  previous: string | null
  results: Post[]
}

export const fetchFeed = createAsyncThunk(
  'posts/fetchFeed',
  async ({ feed, url }: FetchFeedArgs, { rejectWithValue }) => {
    try {
      const endpoint = url ?? `/posts/feed_${feed}/`
      const { data } = await client.get<FeedResponse>(endpoint)
      return { feed, data }
    } catch (err) {
      const axiosErr = err as { response?: { data?: unknown } }
      return rejectWithValue(axiosErr.response?.data)
    }
  },
)

export const fetchAllReadable = createAsyncThunk('posts/fetchAllReadable', async (_: void, { rejectWithValue }) => {
  try {
    const { data } = await client.get<{ results: Post[] }>('/posts/')
    return data.results
  } catch (err) {
    const axiosErr = err as { response?: { data?: unknown } }
    return rejectWithValue(axiosErr.response?.data)
  }
})

interface CreatePostPayload {
  escopo: FeedName
  conteudo: string
  celula?: number
  rede?: number
}

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (payload: CreatePostPayload, { rejectWithValue }) => {
    try {
      const { data } = await client.post('/posts/', payload)
      return data as Post
    } catch (err) {
      const axiosErr = err as { response?: { data?: unknown } }
      return rejectWithValue(axiosErr.response?.data)
    }
  },
)

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state, action) => {
        state.feeds[action.meta.arg.feed].status = 'loading'
        state.feeds[action.meta.arg.feed].error = null
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        const { feed, data } = action.payload
        const isLoadMore = Boolean(action.meta.arg.url)
        state.feeds[feed].status = 'succeeded'
        state.feeds[feed].items = isLoadMore ? [...state.feeds[feed].items, ...data.results] : data.results
        state.feeds[feed].next = data.next
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.feeds[action.meta.arg.feed].status = 'failed'
        state.feeds[action.meta.arg.feed].error = 'Não foi possível carregar o feed.'
      })
      .addCase(fetchAllReadable.pending, (state) => {
        state.allReadable.status = 'loading'
        state.allReadable.error = null
      })
      .addCase(fetchAllReadable.fulfilled, (state, action) => {
        state.allReadable.status = 'succeeded'
        state.allReadable.items = action.payload
      })
      .addCase(fetchAllReadable.rejected, (state) => {
        state.allReadable.status = 'failed'
        state.allReadable.error = 'Não foi possível carregar os posts.'
      })
      .addCase(createPost.pending, (state) => {
        state.createStatus = 'loading'
        state.createError = null
        state.createFieldErrors = null
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.createStatus = 'succeeded'
        state.feeds[action.payload.escopo].items = [action.payload, ...state.feeds[action.payload.escopo].items]
        state.allReadable.items = [action.payload, ...state.allReadable.items]
      })
      .addCase(createPost.rejected, (state, action) => {
        state.createStatus = 'failed'
        const payload = action.payload
        if (payload && typeof payload === 'object') {
          state.createFieldErrors = payload as Record<string, string[]>
          state.createError = 'Não foi possível publicar.'
        } else {
          state.createError = 'Erro de conexão com o servidor.'
        }
      })
      .addCase(logout, () => initialState)
  },
})

export default postsSlice.reducer
