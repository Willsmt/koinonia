import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { fetchNotifications, markAsRead, markAllRead } from './notificationsSlice'

const TIPO_LABELS: Record<string, string> = {
  follow: 'começou a seguir você',
  like: 'curtiu seu post',
  comment: 'comentou seu post',
}

export function NotificationBell() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { items, status } = useAppSelector((state) => state.notifications)
  const [open, setOpen] = useState(false)

  const unreadCount = items.filter((n) => !n.lida).length

  useEffect(() => {
    dispatch(fetchNotifications())
    const interval = setInterval(() => {
      dispatch(fetchNotifications())
    }, 30000)
    return () => clearInterval(interval)
  }, [dispatch])

  function handleClickNotification(n: (typeof items)[number]) {
    dispatch(markAsRead(n.id))
    setOpen(false)
    if ((n.tipo === 'like' || n.tipo === 'comment') && n.post) {
      navigate(`/posts/${n.post}`)
    } else {
      navigate(`/pessoas/${n.actor}`)
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative text-ink-muted hover:text-ink-strong">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg bg-surface shadow-halo">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="text-sm font-semibold text-ink-strong">Notificações</span>
            {unreadCount > 0 && (
              <button onClick={() => dispatch(markAllRead())} className="text-xs text-primary hover:underline">
                Marcar tudo como lido
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {status === 'loading' && items.length === 0 && (
              <p className="p-3 text-sm text-ink-subtle">Carregando...</p>
            )}
            {items.length === 0 && status !== 'loading' && (
              <p className="p-3 text-sm text-ink-subtle">Nenhuma notificação ainda.</p>
            )}
            {items.slice(0, 15).map((n) => (
              <button
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`block w-full border-b border-border p-3 text-left text-sm hover:bg-surface-muted ${
                  n.lida ? 'text-ink-subtle' : 'bg-primary-tint font-medium text-ink-strong'
                }`}
              >
                <span className="font-semibold">{n.actor_nome}</span> {TIPO_LABELS[n.tipo]}
                <p className="mt-0.5 text-xs text-ink-faint">{new Date(n.created_at).toLocaleString('pt-BR')}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
