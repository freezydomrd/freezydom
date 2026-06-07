import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { EMPRESA } from '../../lib/constants'

const NAV = [
  { to: '/admin',             icono: '📊', label: 'Dashboard',    exact: true },
  { to: '/admin/cotizaciones',icono: '📋', label: 'Cotizaciones' },
  { to: '/admin/clientes',    icono: '👥', label: 'Clientes' },
  { to: '/admin/equipos',     icono: '❄️', label: 'Equipos' },
  { to: '/admin/servicios',   icono: '🔧', label: 'Servicios' },
  { to: '/admin/materiales',  icono: '📦', label: 'Materiales' },
  { to: '/admin/precios',     icono: '💰', label: 'Precios' },
  { to: '/admin/usuarios',    icono: '👤', label: 'Usuarios' },
]

export default function AdminLayout() {
  const { perfil, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [esMobil, setEsMobil] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setEsMobil(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Cerrar menú al cambiar de página en móvil
  useEffect(() => {
    if (esMobil) setMenuAbierto(false)
  }, [location.pathname])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  // Título de la página actual
  const paginaActual = NAV.find(n => 
    n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to)
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--fd-fondo)', fontFamily: 'Arial, sans-serif' }}>

      {/* OVERLAY móvil */}
      {esMobil && menuAbierto && (
        <div onClick={() => setMenuAbierto(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
      )}

      {/* SIDEBAR */}
      <aside style={{
        width: 240,
        background: 'var(--fd-azul)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0,
        height: '100vh',
        zIndex: 300,
        transition: 'transform 0.28s cubic-bezier(.4,0,.2,1)',
        transform: esMobil && !menuAbierto ? 'translateX(-100%)' : 'translateX(0)',
        boxShadow: menuAbierto ? '4px 0 24px rgba(0,0,0,0.25)' : 'none',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>❄️</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{EMPRESA.nombre}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{EMPRESA.slogan}</div>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav style={{ flex: 1, padding: '10px 0' }}>
          {NAV.map(({ to, icono, label, exact }) => (
            <NavLink key={to} to={to} end={exact}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 18px', color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
                textDecoration: 'none', fontSize: 15,
                background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              })}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{icono}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Usuario */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>
          <div style={{ fontSize: 14, color: '#fff', fontWeight: 600, marginBottom: 2 }}>{perfil?.nombre}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Administrador</div>
          <button onClick={handleLogout}
            style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{
        flex: 1,
        marginLeft: esMobil ? 0 : 240,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        transition: 'margin-left 0.28s',
        minWidth: 0,
      }}>
        {/* TOPBAR */}
        <header style={{
          background: '#fff',
          borderBottom: '1px solid var(--fd-borde)',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          gap: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {/* Botón hamburguesa - solo móvil */}
          {esMobil && (
            <button onClick={() => setMenuAbierto(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
              <span style={{ display: 'block', width: 22, height: 2, background: 'var(--fd-azul)', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 22, height: 2, background: 'var(--fd-azul)', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 22, height: 2, background: 'var(--fd-azul)', borderRadius: 2 }} />
            </button>
          )}

          {/* Título página actual en móvil */}
          {esMobil && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <span style={{ fontSize: 18 }}>{paginaActual?.icono}</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--fd-texto)' }}>{paginaActual?.label}</span>
            </div>
          )}

          {/* Info empresa en desktop */}
          {!esMobil && (
            <div style={{ flex: 1, fontSize: 13, color: 'var(--fd-texto-muted)' }}>
              {EMPRESA.ciudad} · {EMPRESA.whatsappDisplay}
            </div>
          )}

          {/* Logo compacto en móvil */}
          {esMobil && (
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fd-azul)' }}>❄️ {EMPRESA.nombre}</div>
          )}
        </header>

        {/* PÁGINA */}
        <main style={{
          flex: 1,
          padding: esMobil ? '16px 12px' : '24px 24px',
          maxWidth: 1200,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}>
          <Outlet />
        </main>

        {/* BOTTOM NAV - solo móvil */}
        {esMobil && (
          <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: '#fff', borderTop: '1px solid var(--fd-borde)',
            display: 'flex', zIndex: 100,
            boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
          }}>
            {NAV.slice(0, 5).map(({ to, icono, label, exact }) => (
              <NavLink key={to} to={to} end={exact}
                style={({ isActive }) => ({
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '8px 4px', textDecoration: 'none',
                  color: isActive ? 'var(--fd-azul)' : 'var(--fd-texto-muted)',
                  fontSize: 10, fontWeight: isActive ? 600 : 400,
                  gap: 3, borderTop: isActive ? '2px solid var(--fd-azul)' : '2px solid transparent',
                })}>
                <span style={{ fontSize: 20 }}>{icono}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>

      {/* Espacio para bottom nav en móvil */}
      {esMobil && <div style={{ height: 60 }} />}
    </div>
  )
}
