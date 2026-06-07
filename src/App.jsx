import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/auth/AuthContext'
import { RutaProtegida } from './components/auth/RutaProtegida'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import ClientesPage from './pages/admin/ClientesPage'
import EquiposPage from './pages/admin/EquiposPage'
import ServiciosPage from './pages/admin/ServiciosPage'
import MaterialesPage from './pages/admin/MaterialesPage'
import PreciosPage from './pages/admin/PreciosPage'
import CotizacionesPage from './pages/admin/CotizacionesPage'
import UsuariosPage from './pages/admin/UsuariosPage'
import ClientePortal from './pages/cliente/ClientePortal'

function RedireccionPorRol() {
  const { perfil, loading } = useAuth()
  if (loading) return null
  if (perfil?.rol === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/portal" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RutaProtegida><RedireccionPorRol /></RutaProtegida>} />

      {/* Panel administrativo con layout */}
      <Route path="/admin" element={<RutaProtegida requiereAdmin><AdminLayout /></RutaProtegida>}>
        <Route index element={<AdminDashboard />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="equipos" element={<EquiposPage />} />
        <Route path="servicios" element={<ServiciosPage />} />
        <Route path="materiales" element={<MaterialesPage />} />
        <Route path="precios" element={<PreciosPage />} />
        <Route path="cotizaciones" element={<CotizacionesPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
      </Route>

      {/* Portal cliente */}
      <Route path="/portal" element={<RutaProtegida><ClientePortal /></RutaProtegida>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
