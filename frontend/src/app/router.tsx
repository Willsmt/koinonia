import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { ProfilePage } from '../features/auth/ProfilePage'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { FeedPage } from '../features/posts/FeedPage'
import { PeoplePage } from '../features/people/PeoplePage'
import { PublicProfilePage } from '../features/people/PublicProfilePage'
import { ManagementPage } from '../features/church/ManagementPage'
import { DashboardPage } from '../features/church/DashboardPage'
import { BugReportsPage } from '../features/reports/BugReportsPage'
import { PostDetailPage } from '../features/posts/PostDetailPage'
import { AppLayout } from './AppLayout'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<FeedPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/pessoas" element={<PeoplePage />} />
            <Route path="/pessoas/:id" element={<PublicProfilePage />} />
            <Route path="/gerenciamento" element={<ManagementPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/relatos" element={<BugReportsPage />} />
            <Route path="/posts/:id" element={<PostDetailPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
