import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { fetchFeed, fetchAllReadable } from './postsSlice'
import { fetchCelulas, fetchRedes } from '../church/churchSlice'
import { PostCard } from './PostCard'
import { PostComposer } from './PostComposer'

const TABS = [
  { key: 'global', label: 'Global' },
  { key: 'rede', label: 'Rede' },
  { key: 'celula', label: 'Célula' },
] as const

export function FeedPage() {
  const dispatch = useAppDispatch()
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('global')
  const [selectedCelula, setSelectedCelula] = useState('')
  const [selectedRede, setSelectedRede] = useState('')

  const feed = useAppSelector((state) => state.posts.feeds[tab])
  const allReadable = useAppSelector((state) => state.posts.allReadable)
  const { myMembership, celulas, redes } = useAppSelector((state) => state.church)
  const role = myMembership?.role ?? null
  const isPastor = role === 'pastor'

  useEffect(() => {
    if (isPastor) {
      if (allReadable.status === 'idle') dispatch(fetchAllReadable())
      if (celulas.length === 0) dispatch(fetchCelulas())
      if (redes.length === 0) dispatch(fetchRedes())
    } else if (feed.status === 'idle') {
      dispatch(fetchFeed({ feed: tab }))
    }
  }, [dispatch, tab, feed.status, isPastor, allReadable.status, celulas.length, redes.length])

  useEffect(() => {
    if (!isPastor && feed.status === 'idle') {
      dispatch(fetchFeed({ feed: tab }))
    }
  }, [dispatch, tab, isPastor, feed.status])

  function handleLoadMore() {
    if (feed.next) {
      dispatch(fetchFeed({ feed: tab, url: feed.next }))
    }
  }

  const postsParaPastor =
    tab === 'celula'
      ? allReadable.items.filter((p) => p.escopo === 'celula' && String(p.celula) === selectedCelula)
      : tab === 'rede'
        ? allReadable.items.filter((p) => p.escopo === 'rede' && String(p.rede) === selectedRede)
        : allReadable.items.filter((p) => p.escopo === 'global')

  const mostrandoSeletorPastor = isPastor && (tab === 'celula' || tab === 'rede')
  const itemsParaExibir = isPastor ? postsParaPastor : feed.items

  return (
    <div className="mx-auto max-w-lg space-y-4 py-6 lg:py-0">
      <PostComposer />

      <div className="flex gap-1 rounded-full bg-surface p-1 shadow-halo-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink-default'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mostrandoSeletorPastor && tab === 'celula' && (
        <select
          value={selectedCelula}
          onChange={(e) => setSelectedCelula(e.target.value)}
          className="w-full rounded-[6px] border border-border-input bg-surface-sunken px-3 py-2 text-sm text-ink-strong focus:border-primary focus:outline-none"
        >
          <option value="">Selecione a célula pra ver os posts...</option>
          {celulas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome} ({c.rede_display})
            </option>
          ))}
        </select>
      )}

      {mostrandoSeletorPastor && tab === 'rede' && (
        <select
          value={selectedRede}
          onChange={(e) => setSelectedRede(e.target.value)}
          className="w-full rounded-[6px] border border-border-input bg-surface-sunken px-3 py-2 text-sm text-ink-strong focus:border-primary focus:outline-none"
        >
          <option value="">Selecione a rede pra ver os posts...</option>
          {redes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </select>
      )}

      {!isPastor && feed.status === 'loading' && feed.items.length === 0 && (
        <p className="text-ink-subtle">Carregando...</p>
      )}
      {!isPastor && feed.error && <p className="text-danger">{feed.error}</p>}
      {isPastor && allReadable.status === 'loading' && <p className="text-ink-subtle">Carregando...</p>}
      {isPastor && allReadable.error && <p className="text-danger">{allReadable.error}</p>}

      {itemsParaExibir.length === 0 &&
        !(mostrandoSeletorPastor && ((tab === 'celula' && !selectedCelula) || (tab === 'rede' && !selectedRede))) && (
          <p className="text-ink-subtle">Nenhum post por aqui ainda.</p>
        )}

      <div className="space-y-3">
        {itemsParaExibir.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {!isPastor && feed.next && (
        <button
          onClick={handleLoadMore}
          disabled={feed.status === 'loading'}
          className="w-full rounded-full bg-surface-muted py-2 text-sm font-medium text-ink-default hover:bg-surface-sunken disabled:opacity-50"
        >
          {feed.status === 'loading' ? 'Carregando...' : 'Carregar mais'}
        </button>
      )}
    </div>
  )
}
