import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Btn, Card, Input, Select, Modal, PageHeader, Cargando, Alerta, Badge } from '../../components/ui/index.jsx'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'cliente' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  useEffect(() => { cargar() }, [])
  async function cargar() {
    setCargando(true)
    const { data } = await supabase.from('perfiles').select('*').order('nombre')
    setUsuarios(data || [])
    setCargando(false)
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function crearUsuario() {
    if (!form.nombre || !form.email || !form.password) { setError('Todos los campos son obligatorios'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setGuardando(true); setError('')
    const { error: err } = await supabase.auth.admin ? 
      { error: null } : // fallback
      { error: null }
    // Usamos signUp con metadata para el rol
    const { error: signErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { nombre: form.nombre, rol: form.rol } }
    })
    if (signErr) { setError(signErr.message); setGuardando(false); return }
    setExito('Usuario creado. Debe confirmar su correo.'); setTimeout(() => setExito(''), 5000)
    setModal(false); setForm({ nombre: '', email: '', password: '', rol: 'cliente' }); cargar(); setGuardando(false)
  }

  const COLORES_ROL = { admin: '#1A6DB5', cliente: '#2e7d32' }

  return (
    <div className="fade-in">
      <PageHeader titulo="Usuarios" subtitulo="Gestiona los accesos al sistema"
        accion={<Btn onClick={() => { setError(''); setModal(true) }}>+ Nuevo usuario</Btn>} />
      {exito && <Alerta tipo="exito">{exito}</Alerta>}
      {cargando ? <Cargando /> : (
        <div style={{ display: 'grid', gap: 10 }}>
          {usuarios.map(u => (
            <Card key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{u.nombre}</div>
                <div style={{ fontSize: 13, color: 'var(--fd-texto-muted)', marginTop: 2 }}>{u.email}</div>
              </div>
              <Badge color={COLORES_ROL[u.rol] || '#888'}>{u.rol}</Badge>
            </Card>
          ))}
        </div>
      )}
      <Modal abierto={modal} onClose={() => setModal(false)} titulo="Nuevo usuario">
        {error && <Alerta tipo="error">{error}</Alerta>}
        <Input label="Nombre completo *" value={form.nombre} onChange={set('nombre')} placeholder="Nombre del usuario" />
        <Input label="Correo electrónico *" type="email" value={form.email} onChange={set('email')} placeholder="correo@ejemplo.com" />
        <Input label="Contraseña *" type="password" value={form.password} onChange={set('password')} placeholder="Mínimo 6 caracteres" />
        <Select label="Rol *" value={form.rol} onChange={set('rol')}>
          <option value="cliente">Cliente</option>
          <option value="admin">Administrador</option>
        </Select>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
          <Btn onClick={crearUsuario} disabled={guardando}>{guardando ? 'Creando...' : 'Crear usuario'}</Btn>
        </div>
      </Modal>
    </div>
  )
}
