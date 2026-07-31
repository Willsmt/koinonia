import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../../api/client'

interface Profile {
  id: number
  username: string
  email: string
  nome: string
  apelido: string
  nome_exibicao: string
  telefone: string | null
  foto: string | null
  bio: string
  date_joined: string
}

interface ProfileState {
  data: Profile | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  updateStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  updateError: string | null
  updateFieldErrors: Record<string, string[]> | null
}

const initialState: ProfileState = {
  data: null,
  status: 'idle',
  error: null,
  updateStatus: 'idle',
  updateError: null,
  updateFieldErrors: null,
}

export const fetchMe = createAsyncThunk('profile/fetchMe', async (_: void, { rejectWithValue }) => {
  try {
    const { data } = await client.get('/accounts/me/')
    return data as Profile
  } catch (err) {
    const axiosErr = err as { response?: { data?: unknown } }
    return rejectWithValue(axiosErr.response?.data)
  }
})

// NÃO define Content-Type manualmente aqui — o axios detecta FormData e monta
// o boundary do multipart sozinho. Setar o header à mão quebra o upload.
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const { data } = await client.patch('/accounts/me/', formData)
      return data as Profile
    } catch (err) {
      const axiosErr = err as { response?: { data?: unknown } }
      return rejectWithValue(axiosErr.response?.data)
    }
  },
)

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.data = action.payload
      })
      .addCase(fetchMe.rejected, (state) => {
        state.status = 'failed'
        state.error = 'Não foi possível carregar o perfil.'
      })
      .addCase(updateProfile.pending, (state) => {
        state.updateStatus = 'loading'
        state.updateError = null
        state.updateFieldErrors = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded'
        state.data = action.payload
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateStatus = 'failed'
        const payload = action.payload
        if (payload && typeof payload === 'object') {
          state.updateFieldErrors = payload as Record<string, string[]>
          state.updateError = 'Confira os campos destacados.'
        } else {
          state.updateError = 'Erro de conexão com o servidor.'
        }
      })
  },
})

export default profileSlice.reducer
