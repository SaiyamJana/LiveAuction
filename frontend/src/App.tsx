import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import OwnerRoute from './components/OwnerRoute.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Forbidden from './pages/Forbidden.tsx'
import Home from './pages/Home.tsx'
import Login from './pages/Login.tsx'
import NotFound from './pages/NotFound.tsx'
import OwnerDashboard from './pages/owner/OwnerDashboard.tsx'
import Register from './pages/Register.tsx'
import ResetPassword from './pages/ResetPassword.tsx'
import Settings from './pages/Settings.tsx'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Every page inside this route is drawn inside the shared Layout */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />

          {/* Public */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="forbidden" element={<Forbidden />} />

          {/* Logged-in users only */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="settings" element={<Settings />} />

            {/* Logged in AND role owner */}
            <Route element={<OwnerRoute />}>
              <Route path="owner" element={<OwnerDashboard />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App