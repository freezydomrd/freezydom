import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../components/auth/AuthContext'
import { Btn, Card, Input, Modal, PageHeader, Cargando, Alerta, Badge } from '../../components/ui/index.jsx'

export default function PreciosPage() {
  const { perfil } = useAuth()
  const [equipos, setEquipos] = useState([])
  const [servicios, setServicios] = useState([])
  const [materiales, setMateriales] = useState([])
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState('equipos')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [nuevoPrecio, setNuevoPrecio] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const [{ data: eqs }, { data: svs }, { data: mts }, { data: hist }] = await Promise.all([
      supabase.from('equipos').select('id, nombre, precio_base, marcas(nombre)').eq('activo', true).order('nombre'),
      supabase.from('servicios').select('id, nombre, precio').eq('activo', true).order('nombre'),
      supabase.from('materiales').select('id, nombre, precio_unitario, unidad').eq('activo', true).order('nombre'),
      supabase.from('precio_historial').select('*, perfiles(nombre)').order('created_at', { ascending: false }).limit(30),
    ])
    setEquipos(eqs || []); setServicios(svs || []); setMateriales(mts || []); setHistorial(hist || [])
    setCargando(false)
  }

  function abrirEditar(item, tabla, campoNombre, campoPrecio) {
    setEditando({ ...item, _tabla: tabla, _campoNombre: campoNombre, _campoPrecio: campoPrecio })
    setNuevoPrecio(String(item[campoPrecio]))
    setModal(true)
  }

  async function guardarPrecio() {
    if (!nuevoPrecio || isNaN(nuevoPrecio)) return
    setGuardando(true)
    const precioAnterior = editando[editando._campoPrecio]
    const precioNuevo = parseFloat(nuevoPrecio)
    await supabase.from(editando._tabla).update({ [editando._campoPrecio]: precioNuevo }).eq('id', editando.id)
    await supabase.from('precio_historial').insert({
      tabla: editando._tabla, registro_id: editando.id,
      campo: editando._campoPrecio, precio_anterior: precioAnterior,
      precio_nuevo: precioNuevo, cambiado_por: perfil.id
    })
    setExito('Precio actualizado'); setTimeout(() => setExito(''), 3000)
    setModal(false); cargar(); setGuardando(false)
  }

  const fmt = n => 'RD$ ' + Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })
  const fmtFecha = d => new Date(d).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const TABS = [['equipos', '❄️ Equipos'], ['servicios', '🔧 Servicios'], ['materiales', '📦 Materiales'], ['historial', '📜 Historial']]

  return (
    <div className="fade-in">
      <PageHeader titulo="Gestión de precios" subtitulo="Actualiza precios con registro de auditoría completo" />
      {exito && <Alerta tipo="exito">{exito}</Alerta>}

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', borderRadius: 'var(--fd-radio)', padding: 4, border: '1px solid var(--fd-borde)', width: 'fit-content', flexWrap: 'wrap' }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: tab === id ? 600 : 400, background: tab === id ? 'var(--fd-azul)' : 'transparent', color: tab === id ? '#fff' : 'var(--fd-texto-muted)', fontSize: 13, transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {cargando ? <Cargando /> : (
        <>
          {tab === 'equipos' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {equipos.map(e => (
                <Card key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--fd-texto-muted)' }}>{e.marcas?.nombre}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 700, color: 'var(--fd-azul)', fontSize: 16 }}>{fmt(e.precio_base)}</span>
                    <Btn size="sm" variant="secondary" onClick={() => abrirEditar(e, 'equipos', 'nombre', 'precio_base')}>Cambiar precio</Btn>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {tab === 'servicios' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {servicios.map(s => (
                <Card key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <span style={{ fontWeight: 600 }}>{s.nombre}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 700, color: 'var(--fd-azul)', fontSize: 16 }}>{fmt(s.precio)}</span>
                    <Btn size="sm" variant="secondary" onClick={() => abrirEditar(s, 'servicios', 'nombre', 'precio')}>Cambiar precio</Btn>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {tab === 'materiales' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {materiales.map(m => (
                <Card key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{m.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--fd-texto-muted)' }}>por {m.unidad}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 700, color: 'var(--fd-azul)', fontSize: 16 }}>{fmt(m.precio_unitario)}</span>
                    <Btn size="sm" variant="secondary" onClick={() => abrirEditar(m, 'materiales', 'nombre', 'precio_unitario')}>Cambiar precio</Btn>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {tab === 'historial' && (
            <Card padding={false}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f5f9ff' }}>
                      {['Fecha', 'Tabla', 'ID Registro', 'Precio anterior', 'Precio nuevo', 'Modificado por'].map((h, i) => (
                        <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--fd-texto-muted)', fontSize: 12, borderBottom: '1px solid var(--fd-borde)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historial.length === 0
                      ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--fd-texto-muted)' }}>Sin cambios registrados aún.</td></tr>
                      : historial.map(h => (
                        <tr key={h.id} style={{ borderBottom: '1px solid var(--fd-borde)' }}>
                          <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>{fmtFecha(h.created_at)}</td>
                          <td style={{ padding: '9px 14px' }}><Badge color="#1A6DB5">{h.tabla}</Badge></td>
                          <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontSize: 11, color: 'var(--fd-texto-muted)' }}>{h.registro_id?.slice(0,8)}...</td>
                          <td style={{ padding: '9px 14px', color: 'var(--fd-error)' }}>{fmt(h.precio_anterior)}</td>
                          <td style={{ padding: '9px 14px', color: 'var(--fd-exito)', fontWeight: 600 }}>{fmt(h.precio_nuevo)}</td>
                          <td style={{ padding: '9px 14px' }}>{h.perfiles?.nombre || '—'}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <Modal abierto={modal} onClose={() => setModal(false)} titulo="Cambiar precio" ancho={380}>
        <p style={{ fontSize: 14, color: 'var(--fd-texto-muted)', marginBottom: 16 }}>
          <strong>{editando?.[editando?._campoNombre]}</strong>
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, fontSize: 13 }}>
          <div style={{ flex: 1, background: 'var(--fd-azul-claro)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ color: 'var(--fd-texto-muted)' }}>Precio actual</div>
            <div style={{ fontWeight: 700, color: 'var(--fd-azul)', marginTop: 2 }}>{fmt(editando?.[editando?._campoPrecio])}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 20 }}>→</div>
          <div style={{ flex: 1, background: '#f0fff4', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ color: 'var(--fd-texto-muted)' }}>Precio nuevo</div>
            <div style={{ fontWeight: 700, color: 'var(--fd-exito)', marginTop: 2 }}>{nuevoPrecio ? fmt(nuevoPrecio) : '—'}</div>
          </div>
        </div>
        <Input label="Nuevo precio (RD$)" type="number" value={nuevoPrecio} onChange={e => setNuevoPrecio(e.target.value)} placeholder="0.00" />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
          <Btn onClick={guardarPrecio} disabled={guardando}>{guardando ? 'Guardando...' : 'Confirmar cambio'}</Btn>
        </div>
      </Modal>
    </div>
  )
}
