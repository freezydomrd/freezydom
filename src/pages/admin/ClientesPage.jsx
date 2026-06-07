import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Btn, Card, Input, Textarea, Modal, PageHeader, Cargando, Alerta, ToggleActivo } from '../../components/ui/index.jsx'

const VACÍO = { nombre: '', email: '', telefono: '', direccion: '', empresa: '', notas: '' }

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [filtro, setFiltro] = useState('')
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(VACÍO)
  const [editId, setEditId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const { data } = await supabase.from('clientes').select('*').order('nombre')
    setClientes(data || [])
    setCargando(false)
  }

  function abrirNuevo() { setForm(VACÍO); setEditId(null); setError(''); setModal(true) }
  function abrirEditar(c) { setForm({ nombre: c.nombre, email: c.email || '', telefono: c.telefono || '', direccion: c.direccion || '', empresa: c.empresa || '', notas: c.notas || '' }); setEditId(c.id); setError(''); setModal(true) }
  function cerrar() { setModal(false); setEditId(null); setForm(VACÍO) }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setGuardando(true); setError('')
    const { error: err } = editId
      ? await supabase.from('clientes').update({ ...form }).eq('id', editId)
      : await supabase.from('clientes').insert({ ...form })
    if (err) { setError('Error al guardar. Intenta de nuevo.'); setGuardando(false); return }
    setExito(editId ? 'Cliente actualizado' : 'Cliente creado'); setTimeout(() => setExito(''), 3000)
    cerrar(); cargar(); setGuardando(false)
  }

  async function toggleActivo(c) {
    await supabase.from('clientes').update({ activo: !c.activo }).eq('id', c.id)
    cargar()
  }

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (c.telefono || '').includes(filtro)
  )

  return (
    <div className="fade-in">
      <PageHeader titulo="Clientes" subtitulo={`${clientes.length} clientes registrados`}
        accion={<Btn onClick={abrirNuevo}>+ Nuevo cliente</Btn>} />
      {exito && <Alerta tipo="exito">{exito}</Alerta>}
      <Card style={{ marginBottom: 16 }}>
        <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="🔍  Buscar por nombre, correo o teléfono..."
          style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--fd-borde)', borderRadius: 'var(--fd-radio)', fontSize: 14, outline: 'none', background: '#fafcff' }} />
      </Card>
      {cargando ? <Cargando /> : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtrados.length === 0
            ? <Card><p style={{ color: 'var(--fd-texto-muted)', textAlign: 'center', padding: 16 }}>No se encontraron clientes.</p></Card>
            : filtrados.map(c => (
              <Card key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, opacity: c.activo ? 1 : 0.55 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--fd-texto)' }}>{c.nombre}</div>
                  <div style={{ fontSize: 13, color: 'var(--fd-texto-muted)', marginTop: 2 }}>
                    {[c.email, c.telefono, c.empresa].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ToggleActivo activo={c.activo} onChange={() => toggleActivo(c)} />
                  <Btn size="sm" variant="secondary" onClick={() => abrirEditar(c)}>Editar</Btn>
                </div>
              </Card>
            ))
          }
        </div>
      )}
      <Modal abierto={modal} onClose={cerrar} titulo={editId ? 'Editar cliente' : 'Nuevo cliente'}>
        {error && <Alerta tipo="error">{error}</Alerta>}
        <Input label="Nombre completo *" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Juan Pérez" />
        <Input label="Correo electrónico" type="email" value={form.email} onChange={set('email')} placeholder="cliente@correo.com" />
        <Input label="Teléfono / WhatsApp" value={form.telefono} onChange={set('telefono')} placeholder="809-000-0000" />
        <Input label="Empresa / Negocio" value={form.empresa} onChange={set('empresa')} placeholder="Nombre de la empresa (opcional)" />
        <Input label="Dirección" value={form.direccion} onChange={set('direccion')} placeholder="Calle, sector, ciudad" />
        <Textarea label="Notas internas" value={form.notas} onChange={set('notas')} placeholder="Notas adicionales sobre el cliente..." />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={cerrar}>Cancelar</Btn>
          <Btn onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Btn>
        </div>
      </Modal>
    </div>
  )
}
