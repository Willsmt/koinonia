import { describe, it, expect } from 'vitest'
import reducer, { login, logout } from './authSlice'

describe('authSlice', () => {
  it('login.pending entra em loading e limpa erros', () => {
    const initial = reducer(undefined, { type: '@@INIT' })
    const state = reducer(initial, login.pending('reqId', { username: 'a', password: 'b' }))
    expect(state.status).toBe('loading')
    expect(state.error).toBeNull()
  })

  it('login.fulfilled guarda o token', () => {
    const initial = reducer(undefined, { type: '@@INIT' })
    const state = reducer(initial, login.fulfilled('token-abc', 'reqId', { username: 'a', password: 'b' }))
    expect(state.token).toBe('token-abc')
    expect(state.status).toBe('succeeded')
  })

  it('login.rejected guarda fieldErrors e a mensagem do non_field_errors', () => {
    const initial = reducer(undefined, { type: '@@INIT' })
    const state = reducer(
      initial,
      login.rejected(new Error('fail'), 'reqId', { username: 'a', password: 'b' }, {
        non_field_errors: ['Credenciais inválidas.'],
      }),
    )
    expect(state.status).toBe('failed')
    expect(state.error).toBe('Credenciais inválidas.')
    expect(state.fieldErrors?.non_field_errors).toEqual(['Credenciais inválidas.'])
  })

  it('logout limpa o token', () => {
    const withToken = reducer(undefined, login.fulfilled('token-abc', 'reqId', { username: 'a', password: 'b' }))
    const state = reducer(withToken, logout())
    expect(state.token).toBeNull()
  })
})
