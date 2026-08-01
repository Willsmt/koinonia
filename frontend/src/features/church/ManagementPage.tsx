import { useEffect, useState, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import {
  fetchMyMembership,
  fetchCelulas,
  fetchRedes,
  fetchAllMemberships,
  createMembership,
  deleteMembership,
  createRede,
  deleteRede,
  createCelula,
  deleteCelula,
} from './churchSlice'
import { searchUsers } from '../people/peopleSlice'
import { NomeColorido } from '../../components/NomeColorido'

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

export function ManagementPage() {
  const dispatch = useAppDispatch()
  const profile = useAppSelector((state) => state.profile.data)
  const {
    myMembership,
    membershipStatus,
    celulas,
    redes,
    allMemberships,
    createMembershipStatus,
    createMembershipError,
    createMembershipFieldErrors,
    createRedeStatus,
    createRedeError,
    createRedeFieldErrors,
    createCelulaStatus,
    createCelulaError,
    createCelulaFieldErrors,
    deleteMembershipError,
    deleteRedeError,
    deleteCelulaError,
  } = useAppSelector((state) => state.church)
  const { results: searchResults } = useAppSelector((state) => state.people)

  const role = myMembership?.role ?? null
  const opcoes = opcoesDeRole(role)

  const [term, setTerm] = useState('')
  const [novoRoleSelecionado, setNovoRoleSelecionado] = useState('')
  const [novaCelula, setNovaCelula] = useState('')
  const [novaRede, setNovaRede] = useState('')

  const [nomeRedeNova, setNomeRedeNova] = useState('')
  const [corRedeNova, setCorRedeNova] = useState('#8b5cf6')

  const [nomeCelulaNova, setNomeCelulaNova] = useState('')
  const [redeDaCelulaNova, setRedeDaCelulaNova] = useState('')

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

  function handleCriarRede(e: FormEvent) {
    e.preventDefault()
    if (!nomeRedeNova.trim()) return
    dispatch(createRede({ nome: nomeRedeNova.trim(), cor: corRedeNova }))
    setNomeRedeNova('')
  }

  function handleCriarCelula(e: FormEvent) {
    e.preventDefault()
    const redeId = role === 'network_leader' ? myMembership?.rede : Number(redeDaCelulaNova)
    if (!nomeCelulaNova.trim() || !redeId) return
    dispatch(createCelula({ nome: nomeCelulaNova.trim(), rede: redeId }))
    setNomeCelulaNova('')
  }

  if (membershipStatus === 'loading' || membershipStatus === 'idle') {
    return <p className="text-ink-subtle">Carregando...</p>
  }

  if (!role || role === 'member') {
    return <p className="text-ink-subtle">Você não gerencia a estrutura da igreja.</p>
  }

  const celulasDisponiveis = role === 'network_leader' ? celulas.filter((c) => c.rede === myMembership?.rede) : celulas

  const membrosVisiveis =
    role === 'cell_leader'
      ? allMemberships.filter((m) => m.celula === myMembership?.celula)
      : role === 'network_leader'
        ? allMemberships.filter((m) => m.rede_efetiva === myMembership?.rede)
        : allMemberships

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6 lg:py-0">
      <h1 className="font-display text-xl font-semibold text-ink-strong">Gerenciamento</h1>

      {role === 'pastor' && (
        <div className="rounded-[6px] bg-surface p-4 shadow-halo-sm">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-strong">Redes</h2>
          <form onSubmit={handleCriarRede} className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="nome-rede" className="block text-sm font-medium text-ink-muted">
                Nome
              </label>
              <input
                id="nome-rede"
                type="text"
                value={nomeRedeNova}
                onChange={(e) => setNomeRedeNova(e.target.value)}
                className="mt-1 w-full rounded-[6px] border border-border-input bg-surface-sunken px-3 py-2 text-sm text-ink-strong focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="cor-rede" className="block text-sm font-medium text-ink-muted">
                Cor
              </label>
              <input
                id="cor-rede"
                type="color"
                value={corRedeNova}
                onChange={(e) => setCorRedeNova(e.target.value)}
                className="mt-1 h-9 w-14 rounded-[6px] border border-border-input bg-surface-sunken"
              />
            </div>
            <button
              type="submit"
              disabled={createRedeStatus === 'loading'}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              Criar
            </button>
          </form>
          {createRedeError && <p className="mt-2 text-sm text-danger">{createRedeError}</p>}
          {createRedeFieldErrors && (
            <p className="mt-2 text-sm text-danger">{Object.values(createRedeFieldErrors).flat().join(' ')}</p>
          )}

          <div className="mt-3 space-y-2">
            {redes.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-[6px] border border-border bg-surface-sunken p-2 text-sm">
                <span className="flex items-center gap-2 text-ink-default">
                  <span className="h-3 w-3 rounded-full border border-border-input" style={{ backgroundColor: r.cor }} />
                  {r.nome}
                </span>
                <button onClick={() => dispatch(deleteRede(r.id))} className="text-xs text-danger hover:underline">
                  Remover
                </button>
              </div>
            ))}
            {redes.length === 0 && <p className="text-sm text-ink-subtle">Nenhuma rede ainda.</p>}
          </div>
          {deleteRedeError && <p className="mt-2 text-sm text-danger">{deleteRedeError}</p>}
        </div>
      )}

      {(role === 'pastor' || role === 'network_leader') && (
        <div className="rounded-[6px] bg-surface p-4 shadow-halo-sm">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-strong">Células</h2>
          <form onSubmit={handleCriarCelula} className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="nome-celula" className="block text-sm font-medium text-ink-muted">
                Nome
              </label>
              <input
                id="nome-celula"
                type="text"
                value={nomeCelulaNova}
                onChange={(e) => setNomeCelulaNova(e.target.value)}
                className="mt-1 w-full rounded-[6px] border border-border-input bg-surface-sunken px-3 py-2 text-sm text-ink-strong focus:border-primary focus:outline-none"
              />
            </div>
            {role === 'pastor' ? (
              <div className="flex-1">
                <label htmlFor="rede-celula" className="block text-sm font-medium text-ink-muted">
                  Rede
                </label>
                <select
                  id="rede-celula"
                  value={redeDaCelulaNova}
                  onChange={(e) => setRedeDaCelulaNova(e.target.value)}
                  className="mt-1 w-full rounded-[6px] border border-border-input bg-surface-sunken px-3 py-2 text-sm text-ink-strong focus:border-primary focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  {redes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="pb-2 text-sm text-ink-subtle">Rede: a sua própria (fixo)</p>
            )}
            <button
              type="submit"
              disabled={createCelulaStatus === 'loading'}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              Criar
            </button>
          </form>
          {createCelulaError && <p className="mt-2 text-sm text-danger">{createCelulaError}</p>}
          {createCelulaFieldErrors && (
            <p className="mt-2 text-sm text-danger">{Object.values(createCelulaFieldErrors).flat().join(' ')}</p>
          )}

          <div className="mt-3 space-y-2">
            {celulasDisponiveis.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-[6px] border border-border bg-surface-sunken p-2 text-sm">
                <span className="text-ink-default">
                  {c.nome} <span className="text-ink-faint">({c.rede_display})</span>
                </span>
                <button onClick={() => dispatch(deleteCelula(c.id))} className="text-xs text-danger hover:underline">
                  Remover
                </button>
              </div>
            ))}
            {celulasDisponiveis.length === 0 && <p className="text-sm text-ink-subtle">Nenhuma célula ainda.</p>}
          </div>
          {deleteCelulaError && <p className="mt-2 text-sm text-danger">{deleteCelulaError}</p>}
        </div>
      )}

      <div className="rounded-[6px] bg-surface p-4 shadow-halo-sm">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-strong">Adicionar membro</h2>

        {opcoes.length > 1 && (
          <select
            value={novoRole}
            onChange={(e) => setNovoRoleSelecionado(e.target.value)}
            className="mb-2 w-full rounded-[6px] border border-border-input bg-surface-sunken px-3 py-2 text-sm text-ink-strong focus:border-primary focus:outline-none"
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
            className="mb-2 w-full rounded-[6px] border border-border-input bg-surface-sunken px-3 py-2 text-sm text-ink-strong focus:border-primary focus:outline-none"
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
          <p className="mb-2 text-sm text-ink-subtle">Célula: a sua própria (fixo)</p>
        )}

        {novoRole === 'network_leader' && (
          <select
            value={novaRede}
            onChange={(e) => setNovaRede(e.target.value)}
            className="mb-2 w-full rounded-[6px] border border-border-input bg-surface-sunken px-3 py-2 text-sm text-ink-strong focus:border-primary focus:outline-none"
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
            className="flex-1 rounded-[6px] border border-border-input bg-surface-sunken px-3 py-2 text-sm text-ink-strong placeholder:text-ink-faint focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Buscar
          </button>
        </form>

        {createMembershipError && <p className="mt-2 text-sm text-danger">{createMembershipError}</p>}
        {createMembershipFieldErrors && (
          <p className="mt-2 text-sm text-danger">{Object.values(createMembershipFieldErrors).flat().join(' ')}</p>
        )}

        <div className="mt-3 space-y-2">
          {searchResults.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-[6px] border border-border bg-surface-sunken p-2 text-sm">
              <span className="text-ink-default">
                <NomeColorido nome={u.nome_exibicao} cor={u.cor} /> <span className="text-ink-faint">@{u.username}</span>
              </span>
              <button
                onClick={() => handleAtribuir(u.id)}
                disabled={createMembershipStatus === 'loading' || !novoRole}
                className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                Atribuir
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[6px] bg-surface p-4 shadow-halo-sm">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-strong">Membros geridos por você</h2>
        <div className="space-y-2">
          {membrosVisiveis.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-[6px] border border-border bg-surface-sunken p-2 text-sm">
              <span className="text-ink-default">
                @{m.username} — {ROLE_LABELS[m.role] ?? m.role_display}
              </span>
              <button onClick={() => dispatch(deleteMembership(m.id))} className="text-xs text-danger hover:underline">
                Remover
              </button>
            </div>
          ))}
          {membrosVisiveis.length === 0 && <p className="text-sm text-ink-subtle">Nenhum membro ainda.</p>}
        </div>
        {deleteMembershipError && <p className="mt-2 text-sm text-danger">{deleteMembershipError}</p>}
      </div>
    </div>
  )
}
