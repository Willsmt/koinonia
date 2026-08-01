import { useEffect } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './hooks'
import { logout } from '../features/auth/authSlice'
import { fetchMe } from '../features/auth/profileSlice'
import { fetchMyFollowing } from '../features/interactions/followSlice'
import { fetchMyMembership } from '../features/church/churchSlice'
import { BugReportButton } from '../features/reports/BugReportButton'

export function AppLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
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

  const podeGerenciarMembros =
    myMembership?.role === 'cell_leader' ||
    myMembership?.role === 'network_leader' ||
    myMembership?.role === 'pastor'
  const ehPastor = myMembership?.role === 'pastor'

  function handleLogout() {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <Link to="/" className="text-lg font-semibold">
          koinonia
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/pessoas" className="text-gray-600 hover:text-blue-600">
            Pessoas
          </Link>
          {podeGerenciarMembros && (
            <Link to="/membros" className="text-gray-600 hover:text-blue-600">
              Gerenciar membros
            </Link>
          )}
          {ehPastor && (
            <Link to="/relatos" className="text-gray-600 hover:text-blue-600">
              Relatos
            </Link>
          )}
          <Link to="/perfil" className="text-gray-600 hover:text-blue-600">
            Perfil
          </Link>
          <button onClick={handleLogout} className="text-gray-600 hover:text-red-600">
            Sair
          </button>
        </nav>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
      <BugReportButton />
    </div>
  )
}
