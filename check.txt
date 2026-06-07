import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../components/auth/AuthContext'
import { Btn, Card, Input, Select, Textarea, Modal, PageHeader, Cargando, Alerta, Badge } from '../../components/ui/index.jsx'
import { EMPRESA, ESTADOS_COTIZACION_COLORS, ESTADOS_COTIZACION_LABELS } from '../../lib/constants'

const ESTADO_COLORES = ESTADOS_COTIZACION_COLORS

export default function CotizacionesPage() {
  const { perfil } = useAuth()
  const [cotizaciones, setCotizaciones] = useState([])
  const [clientes, setClientes] = useState([])
  const [equipos, setEquipos] = useState([])
  const [servicios, setServicios] = useState([])
  const [materiales, setMateriales] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(false)
  const [verModal, setVerModal] = useState(false)
  const [cotActual, setCotActual] = useState(null)
  const [filtro, setFiltro] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [exito, setExito] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [form, setForm] = useState({
    cliente_id: '', notas: '', descuento: '0', incluye_itbis: false, fecha_validez: '', items: []
  })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const [{ data: cots }, { data: cls }, { data: eqs }, { data: svs }, { data: mts }] = await Promise.all([
      supabase.from('cotizaciones').select('*, clientes(nombre, telefono, email)').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, nombre, telefono, email').eq('activo', true).order('nombre'),
      supabase.from('equipos').select('id, nombre, precio_base, marcas(nombre)').eq('activo', true).order('nombre'),
      supabase.from('servicios').select('id, nombre, precio').eq('activo', true).order('nombre'),
      supabase.from('materiales').select('id, nombre, precio_unitario, unidad').eq('activo', true).order('nombre'),
    ])
    setCotizaciones(cots || []); setClientes(cls || []); setEquipos(eqs || [])
    setServicios(svs || []); setMateriales(mts || [])
    setCargando(false)
  }

  function abrirNueva() {
    setForm({ cliente_id: '', notas: '', descuento: '0', incluye_itbis: false, fecha_validez: '', items: [] })
    setError(''); setModal(true)
  }

  async function duplicar(cot) {
    const { data: items } = await supabase.from('cotizacion_items').select('*').eq('cotizacion_id', cot.id)
    setForm({
      cliente_id: cot.cliente_id || '', notas: cot.notas || '',
      descuento: String(cot.descuento || 0), incluye_itbis: cot.incluye_itbis,
      fecha_validez: '', items: (items || []).map(i => ({ tipo: i.tipo, referencia_id: i.referencia_id, descripcion: i.descripcion, cantidad: i.cantidad, precio_unitario: i.precio_unitario }))
    })
    setError(''); setModal(true)
  }

  async function verCotizacion(cot) {
    const { data: items } = await supabase.from('cotizacion_items').select('*').eq('cotizacion_id', cot.id)
    setCotActual({ ...cot, items: items || [] })
    setVerModal(true)
  }

  function agregarItem(tipo, ref) {
    let nuevo = { tipo, referencia_id: ref?.id || null, descripcion: '', cantidad: 1, precio_unitario: 0 }
    if (tipo === 'equipo' && ref) { nuevo.descripcion = [ref.nombre, ref.marcas?.nombre].filter(Boolean).join(' - '); nuevo.precio_unitario = ref.precio_base }
    if (tipo === 'servicio' && ref) { nuevo.descripcion = ref.nombre; nuevo.precio_unitario = ref.precio }
    if (tipo === 'material' && ref) { nuevo.descripcion = ref.nombre; nuevo.precio_unitario = ref.precio_unitario }
    setForm(f => ({ ...f, items: [...f.items, nuevo] }))
  }

  function actualizarItem(i, campo, val) {
    setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [campo]: val } : it) }))
  }

  function quitarItem(i) { setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) })) }

  const calcTotales = () => {
    const subtotal = form.items.reduce((s, it) => s + (parseFloat(it.cantidad)||0)*(parseFloat(it.precio_unitario)||0), 0)
    const descuento = parseFloat(form.descuento) || 0
    const base = subtotal - descuento
    const itbis = form.incluye_itbis ? base * 0.18 : 0
    return { subtotal, descuento, itbis, total: base + itbis }
  }

  async function guardar() {
    if (!form.cliente_id) { setError('Selecciona un cliente'); return }
    if (form.items.length === 0) { setError('Agrega al menos un item'); return }
    setGuardando(true); setError('')
    const tots = calcTotales()
    const { data: cot, error: err } = await supabase.from('cotizaciones').insert({
      cliente_id: form.cliente_id, notas: form.notas, descuento: tots.descuento,
      itbis: tots.itbis, subtotal: tots.subtotal, total: tots.total,
      incluye_itbis: form.incluye_itbis, fecha_validez: form.fecha_validez || null,
      creado_por: perfil.id, estado: 'borrador'
    }).select().single()
    if (err) { setError('Error al guardar'); setGuardando(false); return }
    await supabase.from('cotizacion_items').insert(
      form.items.map(it => ({ ...it, cotizacion_id: cot.id, cantidad: parseInt(it.cantidad), precio_unitario: parseFloat(it.precio_unitario) }))
    )
    setExito(`Cotización ${cot.numero} creada`); setTimeout(() => setExito(''), 4000)
    setModal(false); cargar(); setGuardando(false)
  }

  async function cambiarEstado(id, estado) {
    await supabase.from('cotizaciones').update({ estado }).eq('id', id)
    cargar()
    if (cotActual?.id === id) setCotActual(c => ({ ...c, estado }))
  }

  function enviarWhatsApp(cot) {
    const tel = (cot.clientes?.telefono || '').replace(/\D/g, '')
    const msg = encodeURIComponent(`Hola ${cot.clientes?.nombre || ''}, su cotización *${cot.numero}* de *${EMPRESA.nombre}*.\nTotal: *RD$ ${Number(cot.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}*\n${EMPRESA.whatsappDisplay}`)
    window.open(`https://wa.me/${tel || EMPRESA.whatsapp}?text=${msg}`, '_blank')
  }

  const fmt = n => 'RD$ ' + Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })
  const tots = calcTotales()
  const filtradas = cotizaciones.filter(c =>
    (c.numero || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (c.clientes?.nombre || '').toLowerCase().includes(filtro.toLowerCase())
  ).filter(c => !filtroEstado || c.estado === filtroEstado)

  return (
    <div className="fade-in">
      <PageHeader titulo="Cotizaciones" subtitulo={`${cotizaciones.length} cotizaciones`} accion={<Btn onClick={abrirNueva}>+ Nueva cotización</Btn>} />
      {exito && <Alerta tipo="exito">{exito}</Alerta>}

      <Card style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="🔍 Buscar..."
          style={{ flex: 1, minWidth: 180, padding: '9px 12px', border: '1px solid var(--fd-borde)', borderRadius: 'var(--fd-radio)', fontSize: 14, outline: 'none', background: '#fafcff' }} />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          style={{ padding: '9px 12px', border: '1px solid var(--fd-borde)', borderRadius: 'var(--fd-radio)', fontSize: 14, background: '#fafcff' }}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_COTIZACION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Card>

      {cargando ? <Cargando /> : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtradas.length === 0
            ? <Card><p style={{ color: 'var(--fd-texto-muted)', textAlign: 'center', padding: 16 }}>No se encontraron cotizaciones.</p></Card>
            : filtradas.map(c => (
              <Card key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--fd-azul)', fontSize: 16 }}>{c.numero}</span>
                    <Badge color={ESTADO_COLORES[c.estado]}>{ESTADOS_COTIZACION_LABELS[c.estado]}</Badge>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--fd-texto-muted)', marginTop: 2 }}>{c.clientes?.nombre} · {new Date(c.created_at).toLocaleDateString('es-DO')}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{fmt(c.total)}</span>
                  <Btn size="sm" variant="secondary" onClick={() => verCotizacion(c)}>Ver</Btn>
                  <Btn size="sm" variant="secondary" onClick={() => duplicar(c)}>Duplicar</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => enviarWhatsApp(c)}>📱 WA</Btn>
                </div>
              </Card>
            ))
          }
        </div>
      )}

      {/* Modal Nueva */}
      <Modal abierto={modal} onClose={() => setModal(false)} titulo="Nueva cotización" ancho={700}>
        {error && <Alerta tipo="error">{error}</Alerta>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select label="Cliente *" value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
            <option value="">Seleccionar cliente...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>
          <Input label="Válida hasta" type="date" value={form.fecha_validez} onChange={e => setForm(f => ({ ...f, fecha_validez: e.target.value }))} />
        </div>

        <div style={{ background: 'var(--fd-azul-claro)', borderRadius: 8, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fd-azul)', marginBottom: 8 }}>AGREGAR ITEMS:</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {equipos.map(e => <Btn key={e.id} size="sm" variant="secondary" onClick={() => agregarItem('equipo', e)}>❄️ {e.nombre}</Btn>)}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {servicios.map(s => <Btn key={s.id} size="sm" variant="secondary" onClick={() => agregarItem('servicio', s)}>🔧 {s.nombre}</Btn>)}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {materiales.map(m => <Btn key={m.id} size="sm" variant="ghost" onClick={() => agregarItem('material', m)}>📦 {m.nombre}</Btn>)}
          </div>
          <Btn size="sm" style={{ marginTop: 8 }} variant="ghost" onClick={() => agregarItem('otro', null)}>+ Item personalizado</Btn>
        </div>

        {form.items.length > 0 && (
          <div style={{ overflowX: 'auto', marginBottom: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f5f9ff' }}>
                {['Descripción', 'Cant.', 'Precio', 'Subtotal', ''].map((h, i) => (
                  <th key={i} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--fd-texto-muted)', borderBottom: '1px solid var(--fd-borde)', fontSize: 12 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {form.items.map((it, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--fd-borde)' }}>
                    <td style={{ padding: '5px 8px' }}><input value={it.descripcion} onChange={e => actualizarItem(i, 'descripcion', e.target.value)} style={{ width: '100%', border: '1px solid var(--fd-borde)', borderRadius: 6, padding: '4px 8px', fontSize: 13 }} /></td>
                    <td style={{ padding: '5px 8px', width: 65 }}><input type="number" value={it.cantidad} onChange={e => actualizarItem(i, 'cantidad', e.target.value)} style={{ width: '100%', border: '1px solid var(--fd-borde)', borderRadius: 6, padding: '4px 8px', fontSize: 13 }} /></td>
                    <td style={{ padding: '5px 8px', width: 100 }}><input type="number" value={it.precio_unitario} onChange={e => actualizarItem(i, 'precio_unitario', e.target.value)} style={{ width: '100%', border: '1px solid var(--fd-borde)', borderRadius: 6, padding: '4px 8px', fontSize: 13 }} /></td>
                    <td style={{ padding: '5px 8px', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt((parseFloat(it.cantidad)||0)*(parseFloat(it.precio_unitario)||0))}</td>
                    <td style={{ padding: '5px 8px' }}><button onClick={() => quitarItem(i)} style={{ background: 'none', border: 'none', color: 'var(--fd-error)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Descuento (RD$)" type="number" value={form.descuento} onChange={e => setForm(f => ({ ...f, descuento: e.target.value }))} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
            <input type="checkbox" id="itbis" checked={form.incluye_itbis} onChange={e => setForm(f => ({ ...f, incluye_itbis: e.target.checked }))} />
            <label htmlFor="itbis" style={{ fontSize: 14, cursor: 'pointer' }}>ITBIS 18%</label>
          </div>
        </div>

        <div style={{ background: 'var(--fd-azul-claro)', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Subtotal:</span><span>{fmt(tots.subtotal)}</span></div>
          {tots.descuento > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--fd-error)' }}><span>Descuento:</span><span>-{fmt(tots.descuento)}</span></div>}
          {form.incluye_itbis && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>ITBIS:</span><span>{fmt(tots.itbis)}</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, paddingTop: 8, borderTop: '1px solid var(--fd-borde)' }}><span>TOTAL:</span><span style={{ color: 'var(--fd-azul)' }}>{fmt(tots.total)}</span></div>
        </div>

        <Textarea label="Notas" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Condiciones, garantías..." />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
          <Btn onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Crear cotización'}</Btn>
        </div>
      </Modal>

      {/* Modal Ver */}
      {cotActual && (
        <Modal abierto={verModal} onClose={() => setVerModal(false)} titulo={`Cotización ${cotActual.numero}`} ancho={680}>
          <div id="cot-print">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 14, borderBottom: '2px solid var(--fd-azul)' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--fd-azul)' }}>❄️ {EMPRESA.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--fd-texto-muted)' }}>{EMPRESA.whatsappDisplay} · {EMPRESA.email} · {EMPRESA.ciudad}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{cotActual.numero}</div>
                <div style={{ fontSize: 12, color: 'var(--fd-texto-muted)' }}>{new Date(cotActual.created_at).toLocaleDateString('es-DO')}</div>
              </div>
            </div>
            <div style={{ background: 'var(--fd-azul-claro)', borderRadius: 8, padding: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--fd-texto-muted)' }}>COTIZADO A</div>
              <div style={{ fontWeight: 600 }}>{cotActual.clientes?.nombre}</div>
              <div style={{ fontSize: 13, color: 'var(--fd-texto-muted)' }}>{cotActual.clientes?.telefono} {cotActual.clientes?.email}</div>
            </div>
            <div style={{ overflowX: 'auto', marginBottom: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: 'var(--fd-azul)', color: '#fff' }}>
                  {['Descripción', 'Cant.', 'Precio unit.', 'Subtotal'].map((h, i) => (
                    <th key={i} style={{ padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right', fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(cotActual.items || []).map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--fd-borde)', background: i%2===0 ? '#fff' : '#f9fbff' }}>
                      <td style={{ padding: '8px 12px' }}>{it.descripcion}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{it.cantidad}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmt(it.precio_unitario)}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{fmt(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              <div style={{ minWidth: 220, background: 'var(--fd-azul-claro)', borderRadius: 8, padding: 12, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Subtotal:</span><span>{fmt(cotActual.subtotal)}</span></div>
                {cotActual.descuento > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--fd-error)' }}><span>Descuento:</span><span>-{fmt(cotActual.descuento)}</span></div>}
                {cotActual.incluye_itbis && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>ITBIS:</span><span>{fmt(cotActual.itbis)}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, paddingTop: 8, borderTop: '1px solid var(--fd-borde)' }}><span>TOTAL:</span><span style={{ color: 'var(--fd-azul)' }}>{fmt(cotActual.total)}</span></div>
              </div>
            </div>
            {cotActual.notas && <div style={{ background: '#fffef0', border: '1px solid #f0e68c', borderRadius: 8, padding: 10, fontSize: 13, marginBottom: 14 }}><strong>Notas:</strong> {cotActual.notas}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--fd-borde)' }}>
            <select value={cotActual.estado} onChange={e => cambiarEstado(cotActual.id, e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid var(--fd-borde)', borderRadius: 'var(--fd-radio)', fontSize: 14 }}>
              {Object.entries(ESTADOS_COTIZACION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <Btn variant="secondary" onClick={() => enviarWhatsApp(cotActual)}>📱 WhatsApp</Btn>
            <Btn variant="secondary" onClick={() => window.print()}>🖨️ Imprimir</Btn>
            <Btn variant="ghost" onClick={() => setVerModal(false)}>Cerrar</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
