import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { createTestStore } from '../test-store'
import { AppRouter } from '../../app/router'

afterEach(() => {
  localStorage.clear()
})

describe('fluxo de integração: login → feed', () => {
  it('faz login e chega no feed global com o post mockado', async () => {
    const store = createTestStore()
    window.history.pushState({}, '', '/')

    render(
      <Provider store={store}>
        <AppRouter />
      </Provider>,
    )

    // sem token → ProtectedRoute redireciona pra /login
    expect(await screen.findByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Usuário'), 'wills')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-forte-123')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))

    // depois do login: AppLayout busca o perfil, FeedPage busca feed_global —
    // o post mockado no handler precisa aparecer na tela
    expect(await screen.findByText('Deus seja louvado')).toBeInTheDocument()
  })
})
