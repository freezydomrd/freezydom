import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/auth/AuthContext'
import { EMPRESA } from '../lib/constants'

export default function LoginPage() {
  const { login, perfil, recuperarPassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [modo, setModo] = useState('login')
  const [mensaje, setMensaje] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await login(email, password)
      // La redirección la maneja App.jsx según el rol
    } catch (err) {
      setError('Correo o contraseña incorrectos')
    } finally {
      setCargando(false)
    }
  }

  async function handleRecuperar(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await recuperarPassword(email)
      setMensaje('Te enviamos un enlace de recuperación. Revisa tu correo.')
    } catch (err) {
      setError('No pudimos enviar el correo. Verifica la dirección.')
    } finally {
      setCargando(false)
    }
  }

  const s = {
    page: { minHeight: '100vh', background: '#EBF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'Arial, sans-serif' },
    card: { background: '#fff', borderRadius: 16, padding: '2.5rem 2rem', width: '100%', maxWidth: 400, boxShadow: '0 2px 24px rgba(26,109,181,0.10)' },
    logo: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 },
    logoNombre: { fontSize: 26, fontWeight: 700, color: '#1A6DB5', letterSpacing: -0.5 },
    logoSlogan: { fontSize: 12, color: '#888', marginTop: 2 },
    label: { display: 'block', fontSize: 13, color: '#555', marginBottom: 5, fontWeight: 500 },
    input: { width: '100%', padding: '10px 12px', border: '1px solid #d0e0f0', borderRadius: 8, fontSize: 14, outline: 'none', marginBottom: 14, boxSizing: 'border-box', background: '#fafcff' },
    btn: { width: '100%', padding: '11px', background: '#1A6DB5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
    error: { background: '#fff0f0', color: '#c62828', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 14 },
    mensaje: { background: '#f0fff4', color: '#2e7d32', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 14 },
    link: { background: 'none', border: 'none', color: '#1A6DB5', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', marginTop: 16, display: 'block', textAlign: 'center' },
    contacto: { marginTop: 24, textAlign: 'center', fontSize: 12, color: '#aaa' }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <span style={{ fontSize: 40 }}>❄️</span>
          <span style={s.logoNombre}>FreezyDom</span>
          <span style={s.logoSlogan}>{EMPRESA.slogan}</span>
        </div>

        {error && <div style={s.error}>{error}</div>}
        {mensaje && <div style={s.mensaje}>{mensaje}</div>}

        {modo === 'login' ? (
          <form onSubmit={handleLogin}>
            <label style={s.label}>Correo electrónico</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@ejemplo.com" required autoComplete="email" />
            <label style={s.label}>Contraseña</label>
            <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
            <button style={s.btn} type="submit" disabled={cargando}>
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
            <button style={s.link} type="button" onClick={() => { setModo('recuperar'); setError(''); setMensaje('') }}>
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        ) : (
          <form onSubmit={handleRecuperar}>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
            <label style={s.label}>Correo electrónico</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@ejemplo.com" required />
            <button style={s.btn} type="submit" disabled={cargando}>
              {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
            <button style={s.link} type="button" onClick={() => { setModo('login'); setError(''); setMensaje('') }}>
              Volver al inicio de sesión
            </button>
          </form>
        )}

        <div style={s.contacto}>
          ¿Necesitas ayuda? {EMPRESA.whatsappDisplay}
        </div>
      </div>
    </div>
  )
}
