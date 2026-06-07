import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RutaProtegida({ children, requiereAdmin = false }) {
  const { user, perfil, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #EBF2FB', borderTop: '3px solid #1A6DB5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#666', fontSize: 14 }}>Cargando FreezyDom...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  if (requiereAdmin && perfil?.rol !== 'admin') return <Navigate to="/portal" replace />

  return children
}
