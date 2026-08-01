import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../../api/client'
import { logout } from '../auth/authSlice'

export interface CommentItem {
  id: number
  post: number
  author: number
  author_nome: string
  conteudo: string
  created_at: string
}

interface PostComments {
  items: CommentItem[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
}

interface CommentsState {
  byPost: Record<number, PostComments>
  createStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  createError: string | null
}

const initialState: CommentsState = { byPost: {}, createStatus: 'idle', createError: null }

export const fetchComments = createAsyncThunk('comments/fetchComments', async (postId: number) => {
  const { data } = await client.get<{ results: CommentItem[] }>(`/interactions/comments/?post=${postId}`)
  return { postId, items: data.results }
})

export const createComment = createAsyncThunk(
  'comments/createComment',
  async ({ postId, conteudo }: { postId: number; conteudo: string }, { rejectWithValue }) => {
    try {
      const { data } = await client.post<CommentItem>('/interactions/comments/', { post: postId, conteudo })
      return data
    } catch (err) {
      const axiosErr = err as { response?: { data?: unknown } }
      return rejectWithValue(axiosErr.response?.data)
    }
  },
)

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state, action) => {
        const postId = action.meta.arg
        state.byPost[postId] = state.byPost[postId] ?? { items: [], status: 'loading' }
        state.byPost[postId].status = 'loading'
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        const { postId, items } = action.payload
        // merge por id em vez de sobrescrever — uma resposta atrasada
        // (disparada antes de um comentário novo ser criado) não pode
        // apagar o que já foi adicionado localmente enquanto ela viajava
        const existentes = state.byPost[postId]?.items ?? []
        const porId = new Map(items.map((i) => [i.id, i]))
        existentes.forEach((e) => {
          if (!porId.has(e.id)) porId.set(e.id, e)
        })
        const merged = [...porId.values()].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )
        state.byPost[postId] = { items: merged, status: 'succeeded' }
      })
      .addCase(createComment.pending, (state) => {
        state.createStatus = 'loading'
        state.createError = null
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.createStatus = 'succeeded'
        const postId = action.payload.post
        if (!state.byPost[postId]) state.byPost[postId] = { items: [], status: 'succeeded' }
        if (!state.byPost[postId].items.some((i) => i.id === action.payload.id)) {
          state.byPost[postId].items = [...state.byPost[postId].items, action.payload]
        }
      })
      .addCase(createComment.rejected, (state) => {
        state.createStatus = 'failed'
        state.createError = 'Não foi possível comentar.'
      })
      .addCase(logout, () => initialState)
  },
})

export default commentsSlice.reducer
