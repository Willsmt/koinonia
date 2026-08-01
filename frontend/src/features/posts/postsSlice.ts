import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../../api/client'
import { logout } from '../auth/authSlice'
import { toggleFollow } from '../interactions/followSlice'

export interface Post {
  id: number
  author: number
  author_nome: string
  author_foto: string | null
  author_cor: string | null
  escopo: 'celula' | 'rede' | 'global'
  celula: number | null
  rede: number | null
  posted_as: number | null
  conteudo: string
  imagem: string | null
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
  viewedPost: Post | null
  viewedPostStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
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
  viewedPost: null,
  viewedPostStatus: 'idle',
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

interface PageResponse {
  results: Post[]
  next: string | null
}

export const fetchPostById = createAsyncThunk('posts/fetchPostById', async (id: number, { rejectWithValue }) => {
  try {
    const { data } = await client.get<Post>(`/posts/${id}/`)
    return data
  } catch (err) {
    const axiosErr = err as { response?: { data?: unknown } }
    return rejectWithValue(axiosErr.response?.data)
  }
})

export const fetchAllReadable = createAsyncThunk('posts/fetchAllReadable', async (_: void, { rejectWithValue }) => {
  try {
    let url: string | null = '/posts/'
    let all: Post[] = []
    while (url) {
      const { data }: { data: PageResponse } = await client.get(url)
      all = all.concat(data.results)
      url = data.next
    }
    return all
  } catch (err) {
    const axiosErr = err as { response?: { data?: unknown } }
    return rejectWithValue(axiosErr.response?.data)
  }
})

// Sempre multipart — uniforme independente de ter imagem anexada ou não
// (mesma decisão já tomada no update de perfil).
export const createPost = createAsyncThunk('posts/createPost', async (formData: FormData, { rejectWithValue }) => {
  try {
    const { data } = await client.post('/posts/', formData)
    return data as Post
  } catch (err) {
    const axiosErr = err as { response?: { data?: unknown } }
    return rejectWithValue(axiosErr.response?.data)
  }
})

export const deletePost = createAsyncThunk('posts/deletePost', async (postId: number, { rejectWithValue }) => {
  try {
    await client.delete(`/posts/${postId}/`)
    return postId
  } catch (err) {
    const axiosErr = err as { response?: { data?: unknown } }
    return rejectWithValue(axiosErr.response?.data)
  }
})

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
      .addCase(fetchPostById.pending, (state) => {
        state.viewedPostStatus = 'loading'
        state.viewedPost = null
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.viewedPostStatus = 'succeeded'
        state.viewedPost = action.payload
      })
      .addCase(fetchPostById.rejected, (state) => {
        state.viewedPostStatus = 'failed'
      })
      .addCase(toggleFollow.fulfilled, (state) => {
        state.feeds.global.status = 'idle'
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        const id = action.payload
        state.feeds.global.items = state.feeds.global.items.filter((p) => p.id !== id)
        state.feeds.celula.items = state.feeds.celula.items.filter((p) => p.id !== id)
        state.feeds.rede.items = state.feeds.rede.items.filter((p) => p.id !== id)
        state.allReadable.items = state.allReadable.items.filter((p) => p.id !== id)
      })
      .addCase(logout, () => initialState)
  },
})

export default postsSlice.reducer
