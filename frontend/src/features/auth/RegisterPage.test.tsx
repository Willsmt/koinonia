import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/render'
import { RegisterPage } from './RegisterPage'

describe('RegisterPage', () => {
  it('barra submit quando as senhas não coincidem', async () => {
    renderWithProviders(<RegisterPage />)
    await userEvent.type(screen.getByLabelText('Nome'), 'Willians Martins')
    await userEvent.type(screen.getByLabelText('Email'), 'wills@example.com')
    await userEvent.type(screen.getByLabelText('Usuário'), 'wills')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-forte-123')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'outra-coisa')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(await screen.findByText('As senhas não coincidem.')).toBeInTheDocument()
  })

  it('barra usuário fora do padrão aceito pelo backend', async () => {
    renderWithProviders(<RegisterPage />)
    await userEvent.type(screen.getByLabelText('Nome'), 'Willians Martins')
    await userEvent.type(screen.getByLabelText('Email'), 'wills@example.com')
    await userEvent.type(screen.getByLabelText('Usuário'), 'espaço inválido')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-forte-123')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'senha-forte-123')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(await screen.findByText('Apenas letras, números e @ . + - _')).toBeInTheDocument()
  })
})
