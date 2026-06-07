import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Btn, Card, Input, Textarea, Modal, PageHeader, Cargando, Alerta, ToggleActivo } from '../../components/ui/index.jsx'

const VACÍO = { nombre: '', descripcion: '', precio: '' }

export default function ServiciosPage() {
  const [servicios, setServicios] = useState([])
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
    const { data } = await supabase.from('servicios').select('*').order('nombre')
    setServicios(data || [])
    setCargando(false)
  }
  function abrirNuevo() { setForm(VACÍO); setEditId(null); setError(''); setModal(true) }
  function abrirEditar(s) { setForm({ nombre: s.nombre, descripcion: s.descripcion || '', precio: s.precio }); setEditId(s.id); setError(''); setModal(true) }
  function cerrar() { setModal(false); setForm(VACÍO) }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.precio || isNaN(form.precio)) { setError('El precio debe ser un número'); return }
    setGuardando(true)
    const { error: err } = editId
      ? await supabase.from('servicios').update({ ...form, precio: parseFloat(form.precio) }).eq('id', editId)
      : await supabase.from('servicios').insert({ ...form, precio: parseFloat(form.precio) })
    if (err) { setError('Error al guardar'); setGuardando(false); return }
    setExito(editId ? 'Servicio actualizado' : 'Servicio creado'); setTimeout(() => setExito(''), 3000)
    cerrar(); cargar(); setGuardando(false)
  }

  async function toggleActivo(s) {
    await supabase.from('servicios').update({ activo: !s.activo }).eq('id', s.id)
    cargar()
  }

  const fmt = n => 'RD$ ' + Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })

  return (
    <div className="fade-in">
      <PageHeader titulo="Servicios" subtitulo="Gestiona los servicios disponibles para cotizaciones"
        accion={<Btn onClick={abrirNuevo}>+ Nuevo servicio</Btn>} />
      {exito && <Alerta tipo="exito">{exito}</Alerta>}
      {cargando ? <Cargando /> : (
        <div style={{ display: 'grid', gap: 10 }}>
          {servicios.map(s => (
            <Card key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, opacity: s.activo ? 1 : 0.55 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{s.nombre}</div>
                {s.descripcion && <div style={{ fontSize: 13, color: 'var(--fd-texto-muted)', marginTop: 2 }}>{s.descripcion}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 700, color: 'var(--fd-azul)', fontSize: 16 }}>{fmt(s.precio)}</span>
                <ToggleActivo activo={s.activo} onChange={() => toggleActivo(s)} />
                <Btn size="sm" variant="secondary" onClick={() => abrirEditar(s)}>Editar</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal abierto={modal} onClose={cerrar} titulo={editId ? 'Editar servicio' : 'Nuevo servicio'}>
        {error && <Alerta tipo="error">{error}</Alerta>}
        <Input label="Nombre del servicio *" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Instalación" />
        <Input label="Precio (RD$) *" type="number" value={form.precio} onChange={set('precio')} placeholder="0.00" />
        <Textarea label="Descripción" value={form.descripcion} onChange={set('descripcion')} placeholder="Descripción del servicio..." />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={cerrar}>Cancelar</Btn>
          <Btn onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Btn>
        </div>
      </Modal>
    </div>
  )
}
