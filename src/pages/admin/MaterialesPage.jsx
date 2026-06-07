import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Btn, Card, Input, Select, Textarea, Modal, PageHeader, Cargando, Alerta, ToggleActivo } from '../../components/ui/index.jsx'

const VACÍO = { nombre: '', descripcion: '', unidad: 'unidad', precio_unitario: '', stock: '' }
const UNIDADES = ['unidad', 'pie', 'metro', 'rollo', 'libra', 'kg', 'caja', 'galón']

export default function MaterialesPage() {
  const [materiales, setMateriales] = useState([])
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
    const { data } = await supabase.from('materiales').select('*').order('nombre')
    setMateriales(data || [])
    setCargando(false)
  }
  function abrirNuevo() { setForm(VACÍO); setEditId(null); setError(''); setModal(true) }
  function abrirEditar(m) { setForm({ nombre: m.nombre, descripcion: m.descripcion || '', unidad: m.unidad, precio_unitario: m.precio_unitario, stock: m.stock }); setEditId(m.id); setError(''); setModal(true) }
  function cerrar() { setModal(false); setForm(VACÍO) }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setGuardando(true)
    const datos = { ...form, precio_unitario: parseFloat(form.precio_unitario) || 0, stock: parseInt(form.stock) || 0 }
    const { error: err } = editId
      ? await supabase.from('materiales').update(datos).eq('id', editId)
      : await supabase.from('materiales').insert(datos)
    if (err) { setError('Error al guardar'); setGuardando(false); return }
    setExito(editId ? 'Material actualizado' : 'Material creado'); setTimeout(() => setExito(''), 3000)
    cerrar(); cargar(); setGuardando(false)
  }

  async function toggleActivo(m) {
    await supabase.from('materiales').update({ activo: !m.activo }).eq('id', m.id)
    cargar()
  }

  const fmt = n => 'RD$ ' + Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })
  const filtrados = materiales.filter(m => m.nombre.toLowerCase().includes(filtro.toLowerCase()))

  return (
    <div className="fade-in">
      <PageHeader titulo="Materiales" subtitulo={`${materiales.length} materiales registrados`}
        accion={<Btn onClick={abrirNuevo}>+ Nuevo material</Btn>} />
      {exito && <Alerta tipo="exito">{exito}</Alerta>}
      <Card style={{ marginBottom: 16 }}>
        <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="🔍  Buscar material..."
          style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--fd-borde)', borderRadius: 'var(--fd-radio)', fontSize: 14, outline: 'none', background: '#fafcff' }} />
      </Card>
      {cargando ? <Cargando /> : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtrados.map(m => (
            <Card key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, opacity: m.activo ? 1 : 0.55 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{m.nombre}</div>
                <div style={{ fontSize: 13, color: 'var(--fd-texto-muted)', marginTop: 2 }}>
                  {fmt(m.precio_unitario)} / {m.unidad} · Stock: {m.stock}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ToggleActivo activo={m.activo} onChange={() => toggleActivo(m)} />
                <Btn size="sm" variant="secondary" onClick={() => abrirEditar(m)}>Editar</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal abierto={modal} onClose={cerrar} titulo={editId ? 'Editar material' : 'Nuevo material'}>
        {error && <Alerta tipo="error">{error}</Alerta>}
        <Input label="Nombre *" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Tubería de cobre 1/4" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select label="Unidad" value={form.unidad} onChange={set('unidad')}>
            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
          </Select>
          <Input label="Precio unitario (RD$)" type="number" value={form.precio_unitario} onChange={set('precio_unitario')} placeholder="0.00" />
        </div>
        <Input label="Stock disponible" type="number" value={form.stock} onChange={set('stock')} placeholder="0" />
        <Textarea label="Descripción" value={form.descripcion} onChange={set('descripcion')} placeholder="Descripción opcional..." />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={cerrar}>Cancelar</Btn>
          <Btn onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Btn>
        </div>
      </Modal>
    </div>
  )
}
