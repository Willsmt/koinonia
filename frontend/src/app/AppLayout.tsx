import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAppDispatch } from './hooks'
import { logout } from '../features/auth/authSlice'

export function AppLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

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
    </div>
  )
}
