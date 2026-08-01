import { useEffect, useState, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import {
  fetchMyMembership,
  fetchCelulas,
  fetchRedes,
  fetchAllMemberships,
  createMembership,
  deleteMembership,
} from './churchSlice'
import { searchUsers } from '../people/peopleSlice'

const ROLE_LABELS: Record<string, string> = {
  member: 'Membro',
  cell_leader: 'Líder de célula',
  network_leader: 'Líder de rede',
  pastor: 'Pastor',
}

function opcoesDeRole(role: string | null): string[] {
  if (role === 'cell_leader') return ['member']
  if (role === 'network_leader') return ['member', 'cell_leader']
  if (role === 'pastor') return ['member', 'cell_leader', 'network_leader', 'pastor']
  return []
}

export function MembersAdminPage() {
  const dispatch = useAppDispatch()
  const profile = useAppSelector((state) => state.profile.data)
  const {
    myMembership,
    membershipStatus,
    celulas,
    redes,
    allMemberships,
    createStatus,
    createError,
    createFieldErrors,
  } = useAppSelector((state) => state.church)
  const { results: searchResults } = useAppSelector((state) => state.people)

  const role = myMembership?.role ?? null
  const opcoes = opcoesDeRole(role)

  const [term, setTerm] = useState('')
  const [novoRoleSelecionado, setNovoRoleSelecionado] = useState('')
  const [novaCelula, setNovaCelula] = useState('')
  const [novaRede, setNovaRede] = useState('')

  // derivado direto do papel do ator — quando só existe 1 opção (cell_leader),
  // não tem seletor pra mostrar, então não pode depender de estado sincronizado
  // por efeito (era exatamente o anti-padrão que o eslint acusou: setState
  // síncrono dentro de useEffect, gerando re-render em cascata)
  const novoRole = opcoes.length === 1 ? opcoes[0] : novoRoleSelecionado

  useEffect(() => {
    if (profile) dispatch(fetchMyMembership(profile.id))
  }, [dispatch, profile])

  useEffect(() => {
    dispatch(fetchCelulas())
    dispatch(fetchRedes())
    dispatch(fetchAllMemberships())
  }, [dispatch])

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    dispatch(searchUsers(term))
  }

  function handleAtribuir(userId: number) {
    if (!novoRole) return
    const payload: { user: number; role: string; celula?: number; rede?: number } = {
      user: userId,
      role: novoRole,
    }

    if (novoRole === 'member' || novoRole === 'cell_leader') {
      const celulaId = role === 'cell_leader' ? myMembership?.celula : Number(novaCelula)
      if (!celulaId) return
      payload.celula = celulaId
    }
    if (novoRole === 'network_leader') {
      if (!novaRede) return
      payload.rede = Number(novaRede)
    }

    dispatch(createMembership(payload))
  }

  if (membershipStatus === 'loading' || membershipStatus === 'idle') {
    return <p className="text-gray-500">Carregando...</p>
  }

  if (!role || role === 'member') {
    return <p className="text-gray-500">Você não gerencia membros.</p>
  }

  const celulasDisponiveis = role === 'network_leader' ? celulas.filter((c) => c.rede === myMembership?.rede) : celulas

  const membrosVisiveis =
    role === 'cell_leader'
      ? allMemberships.filter((m) => m.celula === myMembership?.celula)
      : role === 'network_leader'
        ? allMemberships.filter((m) => m.rede_efetiva === myMembership?.rede)
        : allMemberships

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-lg bg-white p-4 shadow">
        <h1 className="mb-3 text-lg font-semibold">Adicionar membro</h1>

        {opcoes.length > 1 && (
          <select
            value={novoRole}
            onChange={(e) => setNovoRoleSelecionado(e.target.value)}
            className="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione o papel...</option>
            {opcoes.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        )}

        {(novoRole === 'member' || novoRole === 'cell_leader') && role !== 'cell_leader' && (
          <select
            value={novaCelula}
            onChange={(e) => setNovaCelula(e.target.value)}
            className="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione a célula...</option>
            {celulasDisponiveis.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.rede_display})
              </option>
            ))}
          </select>
        )}
        {(novoRole === 'member' || novoRole === 'cell_leader') && role === 'cell_leader' && (
          <p className="mb-2 text-sm text-gray-500">Célula: a sua própria (fixo)</p>
        )}

        {novoRole === 'network_leader' && (
          <select
            value={novaRede}
            onChange={(e) => setNovaRede(e.target.value)}
            className="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione a rede...</option>
            {redes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
        )}

        <form onSubmit={handleSearch} className="mt-2 flex gap-2">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar usuário pra adicionar..."
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Buscar
          </button>
        </form>

        {createError && <p className="mt-2 text-sm text-red-600">{createError}</p>}
        {createFieldErrors && (
          <p className="mt-2 text-sm text-red-600">{Object.values(createFieldErrors).flat().join(' ')}</p>
        )}

        <div className="mt-3 space-y-2">
          {searchResults.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded border border-gray-200 p-2 text-sm">
              <span>
                {u.nome_exibicao} <span className="text-gray-400">@{u.username}</span>
              </span>
              <button
                onClick={() => handleAtribuir(u.id)}
                disabled={createStatus === 'loading' || !novoRole}
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Atribuir
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">Membros geridos por você</h2>
        <div className="space-y-2">
          {membrosVisiveis.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded border border-gray-200 p-2 text-sm">
              <span>
                @{m.username} — {ROLE_LABELS[m.role] ?? m.role_display}
              </span>
              <button onClick={() => dispatch(deleteMembership(m.id))} className="text-xs text-red-600 hover:underline">
                Remover
              </button>
            </div>
          ))}
          {membrosVisiveis.length === 0 && <p className="text-sm text-gray-500">Nenhum membro ainda.</p>}
        </div>
      </div>
    </div>
  )
}
