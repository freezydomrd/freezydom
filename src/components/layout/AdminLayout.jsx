import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { EMPRESA } from '../../lib/constants'

const NAV = [
  { to: '/admin',            icono: '📊', label: 'Dashboard',    exact: true },
  { to: '/admin/clientes',   icono: '👥', label: 'Clientes' },
  { to: '/admin/cotizaciones',icono: '📋', label: 'Cotizaciones' },
  { to: '/admin/equipos',    icono: '❄️', label: 'Equipos' },
  { to: '/admin/servicios',  icono: '🔧', label: 'Servicios' },
  { to: '/admin/materiales', icono: '📦', label: 'Materiales' },
  { to: '/admin/precios',    icono: '💰', label: 'Precios' },
  { to: '/admin/usuarios',   icono: '👤', label: 'Usuarios' },
]

export default function AdminLayout() {
  const { perfil, logout } = useAuth()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const s = {
    wrap: { display: 'flex', minHeight: '100vh', background: 'var(--fd-fondo)', fontFamily: 'Arial, sans-serif' },
    sidebar: {
      width: 220, background: 'var(--fd-azul)', display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100,
      transition: 'transform 0.25s ease',
    },
    sidebarMobile: { transform: menuAbierto ? 'translateX(0)' : 'translateX(-100%)' },
    logo: { padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.12)' },
    logoNombre: { fontSize: 20, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 },
    logoSlogan: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
    nav: { flex: 1, padding: '12px 0', overflowY: 'auto' },
    navLink: {
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
      color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14,
      transition: 'background 0.15s', borderRadius: 0,
    },
    navLinkActive: { background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600 },
    usuario: { padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.12)' },
    usuarioNombre: { fontSize: 13, color: '#fff', fontWeight: 500, marginBottom: 2 },
    usuarioRol: { fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 },
    btnLogout: {
      marginTop: 8, width: '100%', padding: '7px 0', background: 'rgba(255,255,255,0.1)',
      color: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
    },
    main: { marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' },
    topbar: {
      background: '#fff', borderBottom: '1px solid var(--fd-borde)', padding: '0 20px',
      height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50,
    },
    menuBtn: { display: 'none', background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--fd-azul)' },
    content: { flex: 1, padding: '24px 20px', maxWidth: 1200, width: '100%', margin: '0 auto' },
    overlay: {
      display: menuAbierto ? 'block' : 'none',
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99,
    },
  }

  return (
    <div style={s.wrap}>
      {/* Overlay móvil */}
      <div style={s.overlay} onClick={() => setMenuAbierto(false)} />

      {/* Sidebar */}
      <aside style={{ ...s.sidebar, ...(window.innerWidth < 768 ? s.sidebarMobile : {}) }}>
        <div style={s.logo}>
          <div style={s.logoNombre}><span>❄️</span>{EMPRESA.nombre}</div>
          <div style={s.logoSlogan}>{EMPRESA.slogan}</div>
        </div>

        <nav style={s.nav}>
          {NAV.map(({ to, icono, label, exact }) => (
            <NavLink
              key={to} to={to} end={exact}
              style={({ isActive }) => ({ ...s.navLink, ...(isActive ? s.navLinkActive : {}) })}
              onClick={() => setMenuAbierto(false)}
            >
              <span style={{ fontSize: 16 }}>{icono}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={s.usuario}>
          <div style={s.usuarioNombre}>{perfil?.nombre}</div>
          <div style={s.usuarioRol}>{perfil?.rol}</div>
          <button style={s.btnLogout} onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div style={s.main}>
        <header style={s.topbar}>
          <button style={{ ...s.menuBtn, display: 'flex' }} onClick={() => setMenuAbierto(v => !v)}>
            ☰
          </button>
          <div style={{ fontSize: 13, color: 'var(--fd-texto-muted)' }}>
            {EMPRESA.ciudad} · {EMPRESA.whatsappDisplay}
          </div>
        </header>
        <main style={s.content}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          aside { transform: translateX(0) !important; }
          .menu-btn { display: none !important; }
        }
        @media (max-width: 767px) {
          aside { transform: ${menuAbierto ? 'translateX(0)' : 'translateX(-100%)'}; }
          [data-main] { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
