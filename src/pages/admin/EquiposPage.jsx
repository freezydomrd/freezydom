import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Btn, Card, Input, Select, Textarea, Modal, PageHeader, Cargando, Alerta, ToggleActivo, Badge } from '../../components/ui/index.jsx'

const VACÍO = { nombre: '', marca_id: '', modelo: '', btu: '', descripcion: '', precio_base: '', imagen_url: '' }

export default function EquiposPage() {
  const [equipos, setEquipos] = useState([])
  const [marcas, setMarcas] = useState([])
  const [filtro, setFiltro] = useState('')
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(false)
  const [modalMarca, setModalMarca] = useState(false)
  const [form, setForm] = useState(VACÍO)
  const [editId, setEditId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [nuevaMarca, setNuevaMarca] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const [{ data: eqs }, { data: mks }] = await Promise.all([
      supabase.from('equipos').select('*, marcas(nombre)').order('nombre'),
      supabase.from('marcas').select('*').eq('activa', true).order('nombre'),
    ])
    setEquipos(eqs || [])
    setMarcas(mks || [])
    setCargando(false)
  }

  function abrirNuevo() { setForm(VACÍO); setEditId(null); setError(''); setModal(true) }
  function abrirEditar(e) { setForm({ nombre: e.nombre, marca_id: e.marca_id || '', modelo: e.modelo || '', btu: e.btu || '', descripcion: e.descripcion || '', precio_base: e.precio_base || '', imagen_url: e.imagen_url || '' }); setEditId(e.id); setError(''); setModal(true) }
  function cerrar() { setModal(false); setEditId(null); setForm(VACÍO) }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.precio_base || isNaN(form.precio_base)) { setError('El precio debe ser un número válido'); return }
    setGuardando(true); setError('')
    const datos = { ...form, btu: form.btu ? parseInt(form.btu) : null, precio_base: parseFloat(form.precio_base), marca_id: form.marca_id || null }
    const { error: err } = editId
      ? await supabase.from('equipos').update(datos).eq('id', editId)
      : await supabase.from('equipos').insert(datos)
    if (err) { setError('Error al guardar.'); setGuardando(false); return }
    setExito(editId ? 'Equipo actualizado' : 'Equipo creado'); setTimeout(() => setExito(''), 3000)
    cerrar(); cargar(); setGuardando(false)
  }

  async function toggleActivo(eq) {
    await supabase.from('equipos').update({ activo: !eq.activo }).eq('id', eq.id)
    cargar()
  }

  async function guardarMarca() {
    if (!nuevaMarca.trim()) return
    await supabase.from('marcas').insert({ nombre: nuevaMarca.trim() })
    setNuevaMarca(''); setModalMarca(false); cargar()
  }

  const fmt = n => 'RD$ ' + Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })
  const filtrados = equipos.filter(e => e.nombre.toLowerCase().includes(filtro.toLowerCase()) || (e.marcas?.nombre || '').toLowerCase().includes(filtro.toLowerCase()))

  return (
    <div className="fade-in">
      <PageHeader titulo="Equipos" subtitulo={`${equipos.length} equipos registrados`}
        accion={<div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" size="sm" onClick={() => setModalMarca(true)}>+ Marca</Btn>
          <Btn onClick={abrirNuevo}>+ Nuevo equipo</Btn>
        </div>} />
      {exito && <Alerta tipo="exito">{exito}</Alerta>}
      <Card style={{ marginBottom: 16 }}>
        <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="🔍  Buscar por nombre o marca..."
          style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--fd-borde)', borderRadius: 'var(--fd-radio)', fontSize: 14, outline: 'none', background: '#fafcff' }} />
      </Card>
      {cargando ? <Cargando /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtrados.map(e => (
            <Card key={e.id} style={{ opacity: e.activo ? 1 : 0.55 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{e.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--fd-texto-muted)', marginTop: 2 }}>
                    {[e.marcas?.nombre, e.modelo, e.btu ? `${e.btu} BTU` : null].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <ToggleActivo activo={e.activo} onChange={() => toggleActivo(e)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--fd-azul)' }}>{fmt(e.precio_base)}</span>
                <Btn size="sm" variant="secondary" onClick={() => abrirEditar(e)}>Editar</Btn>
              </div>
            </Card>
          ))}
          {filtrados.length === 0 && <Card><p style={{ color: 'var(--fd-texto-muted)', textAlign: 'center' }}>Sin equipos.</p></Card>}
        </div>
      )}

      <Modal abierto={modal} onClose={cerrar} titulo={editId ? 'Editar equipo' : 'Nuevo equipo'} ancho={540}>
        {error && <Alerta tipo="error">{error}</Alerta>}
        <Input label="Nombre del equipo *" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Split Inverter 12000 BTU" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select label="Marca" value={form.marca_id} onChange={set('marca_id')}>
            <option value="">Sin marca</option>
            {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </Select>
          <Input label="Modelo" value={form.modelo} onChange={set('modelo')} placeholder="Ej: LG-S12EQ" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="BTU" type="number" value={form.btu} onChange={set('btu')} placeholder="12000" />
          <Input label="Precio base (RD$) *" type="number" value={form.precio_base} onChange={set('precio_base')} placeholder="0.00" />
        </div>
        <Textarea label="Descripción" value={form.descripcion} onChange={set('descripcion')} placeholder="Descripción del equipo..." />
        <Input label="URL de imagen (opcional)" value={form.imagen_url} onChange={set('imagen_url')} placeholder="https://..." />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={cerrar}>Cancelar</Btn>
          <Btn onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Btn>
        </div>
      </Modal>

      <Modal abierto={modalMarca} onClose={() => setModalMarca(false)} titulo="Nueva marca" ancho={360}>
        <Input label="Nombre de la marca" value={nuevaMarca} onChange={e => setNuevaMarca(e.target.value)} placeholder="Ej: Carrier" />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setModalMarca(false)}>Cancelar</Btn>
          <Btn onClick={guardarMarca}>Guardar marca</Btn>
        </div>
      </Modal>
    </div>
  )
}
