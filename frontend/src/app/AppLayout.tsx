import { useEffect, useState, type ReactNode } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './hooks'
import { logout } from '../features/auth/authSlice'
import { fetchMe } from '../features/auth/profileSlice'
import { fetchMyFollowing } from '../features/interactions/followSlice'
import { fetchMyMembership } from '../features/church/churchSlice'
import { BugReportButton } from '../features/reports/BugReportButton'
import { NotificationBell } from '../features/notifications/NotificationBell'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

function IconFeed() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h4l2-7 4 14 2-7h4" />
    </svg>
  )
}
function IconPessoas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M10.5 7v7M7 10.5h7" />
      <path d="M15.5 15.5L21 21" />
    </svg>
  )
}
function IconGerenciamento() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2.3" />
      <circle cx="18" cy="6" r="2.3" />
      <circle cx="12" cy="18" r="2.3" />
      <path d="M7.8 7.6L10.5 16M16.2 7.6L13.5 16M8.3 6h7.4" />
    </svg>
  )
}
function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V4M16 20v-7M2 20h20" />
    </svg>
  )
}
function IconRelatos() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3v18" />
      <path d="M4 4h12l-2 4 2 4H4" />
    </svg>
  )
}
function IconPerfil() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5l8 4.6v9.8l-8 4.6-8-4.6V7.1z" />
      <circle cx="12" cy="10" r="2.6" />
      <path d="M7.5 17c1-2.2 2.7-3.3 4.5-3.3s3.5 1.1 4.5 3.3" />
    </svg>
  )
}
function IconSair() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}
function IconMenu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

export function AppLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const profile = useAppSelector((state) => state.profile.data)
  const followStatus = useAppSelector((state) => state.follow.status)
  const { myMembership, membershipStatus } = useAppSelector((state) => state.church)

  useEffect(() => {
    if (!profile) {
      dispatch(fetchMe())
    }
  }, [dispatch, profile])

  useEffect(() => {
    if (followStatus === 'idle') {
      dispatch(fetchMyFollowing())
    }
  }, [dispatch, followStatus])

  useEffect(() => {
    if (profile && membershipStatus === 'idle') {
      dispatch(fetchMyMembership(profile.id))
    }
  }, [dispatch, profile, membershipStatus])

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  const podeGerenciarMembros =
    myMembership?.role === 'cell_leader' ||
    myMembership?.role === 'network_leader' ||
    myMembership?.role === 'pastor'
  const ehPastor = myMembership?.role === 'pastor'

  function handleLogout() {
    dispatch(logout())
    navigate('/login')
  }

  const navItems: NavItem[] = [
    { to: '/', label: 'Feed', icon: <IconFeed /> },
    { to: '/pessoas', label: 'Pessoas', icon: <IconPessoas /> },
    ...(podeGerenciarMembros ? [{ to: '/gerenciamento', label: 'Gerenciamento', icon: <IconGerenciamento /> }] : []),
    ...(podeGerenciarMembros ? [{ to: '/dashboard', label: 'Dashboard', icon: <IconDashboard /> }] : []),
    ...(ehPastor ? [{ to: '/relatos', label: 'Relatos', icon: <IconRelatos /> }] : []),
    { to: '/perfil', label: 'Perfil', icon: <IconPerfil /> },
  ]

  function isActive(to: string) {
    if (to === '/') return location.pathname === '/'
    return location.pathname.startsWith(to)
  }

  const sidebarBody = (
    <div className="flex h-full flex-col bg-[linear-gradient(175deg,#050308_0%,#1a0d2b_55%,#2c0f36_100%)] px-4 py-7">
      <span className="mb-9 px-2 font-wordmark text-[19px] font-bold uppercase tracking-[0.14em] text-white">
        koinonia
      </span>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = isActive(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] transition-colors ${
                active
                  ? 'bg-primary/20 font-semibold text-white shadow-[inset_0_0_0_1px_rgba(139,92,246,0.35)]'
                  : 'font-medium text-white/60 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/65 transition-colors hover:bg-white/5 hover:text-white"
      >
        <IconSair />
        <span>Sair</span>
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      {/* Sidebar fixa — desktop */}
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:w-[250px] lg:flex-shrink-0 lg:border-r lg:border-primary/20">
        {sidebarBody}
      </aside>

      {/* Drawer off-canvas — mobile/tablet */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-overlay" onClick={() => setDrawerOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80vw] shadow-halo">{sidebarBody}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:justify-end lg:border-b-0 lg:bg-transparent lg:px-10 lg:py-6">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
            className="text-ink-muted hover:text-ink-strong lg:hidden"
          >
            <IconMenu />
          </button>
          <Link to="/" className="font-wordmark text-base font-bold uppercase tracking-[0.14em] text-ink-strong lg:hidden">
            koinonia
          </Link>
          <NotificationBell />
        </header>

        <main className="flex-1 px-4 pb-6 sm:px-6 lg:px-10 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <BugReportButton />
    </div>
  )
}
