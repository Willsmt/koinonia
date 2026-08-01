import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/render'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('bloqueia submit com campos vazios (zod, antes de bater no backend)', async () => {
    renderWithProviders(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(await screen.findAllByText('Obrigatório')).toHaveLength(2)
  })

  it('loga com credenciais válidas e guarda o token', async () => {
    const { store } = renderWithProviders(<LoginPage />)
    await userEvent.type(screen.getByLabelText('Usuário'), 'wills')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-forte-123')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(store.getState().auth.token).toBe('fake-token-123')
    })
  })

  it('mostra o erro do backend com credenciais inválidas', async () => {
    renderWithProviders(<LoginPage />)
    await userEvent.type(screen.getByLabelText('Usuário'), 'wills')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-errada')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText(/não foi possível fazer login/i)).toBeInTheDocument()
  })
})
