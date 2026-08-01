import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { createTestStore } from '../../test/test-store'
import { ProtectedRoute } from './ProtectedRoute'
import { login } from './authSlice'

function Private() {
  return <div>Área restrita</div>
}
function Login() {
  return <div>Tela de login</div>
}

const rotas = (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<Private />} />
    </Route>
  </Routes>
)

describe('ProtectedRoute', () => {
  it('redireciona pra /login quando não há token', () => {
    const store = createTestStore()
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']}>{rotas}</MemoryRouter>
      </Provider>,
    )
    expect(screen.getByText('Tela de login')).toBeInTheDocument()
    expect(screen.queryByText('Área restrita')).not.toBeInTheDocument()
  })

  it('renderiza a rota protegida quando já há token no primeiro render', () => {
    const store = createTestStore()
    // dispatch ANTES do render — o componente já nasce autenticado,
    // nunca chega a disparar o redirect pra /login
    store.dispatch(login.fulfilled('fake-token', 'reqId', { username: 'a', password: 'b' }))
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']}>{rotas}</MemoryRouter>
      </Provider>,
    )
    expect(screen.getByText('Área restrita')).toBeInTheDocument()
  })
})
