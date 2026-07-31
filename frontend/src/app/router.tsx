import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { ProfilePage } from '../features/auth/ProfilePage'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { AppLayout } from './AppLayout'

function Home() {
  return <div className="text-xl font-semibold">Bem-vindo(a) 👋</div>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/perfil" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
