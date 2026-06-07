import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../components/auth/AuthContext'
import { Card, Badge, Btn, Cargando, PageHeader } from '../../components/ui/index.jsx'
import { EMPRESA, ESTADOS_COTIZACION_COLORS, ESTADOS_COTIZACION_LABELS } from '../../lib/constants'

export default function ClientePortal() {
  const { user, perfil, logout } = useAuth()
  const [cotizaciones, setCotizaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cotActual, setCotActual] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const { data: cliente } = await supabase.from('clientes').select('id').eq('usuario_id', user.id).single()
    if (!cliente) { setCargando(false); return }
    const { data: cots } = await supabase.from('cotizaciones')
      .select('*, cotizacion_items(*)')
      .eq('cliente_id', cliente.id)
      .order('created_at', { ascending: false })
    setCotizaciones(cots || [])
    setCargando(false)
  }

  const fmt = n => 'RD$ ' + Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fd-fondo)', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: 'var(--fd-azul)', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>❄️ {EMPRESA.nombre}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{perfil?.nombre}</span>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}>Salir</button>
        </div>
      </div>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
        <PageHeader titulo="Mis cotizaciones" subtitulo={`${cotizaciones.length} cotizaciones`} />
        {cargando ? <Cargando /> : cotizaciones.length === 0
          ? <Card><p style={{ textAlign: 'center', color: 'var(--fd-texto-muted)', padding: 24 }}>No tienes cotizaciones aún.<br /><br />Contáctanos: <strong>{EMPRESA.whatsappDisplay}</strong></p></Card>
          : cotizaciones.map(c => (
            <Card key={c.id} style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => setCotActual(cotActual?.id === c.id ? null : c)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--fd-azul)' }}>{c.numero}</span>
                    <Badge color={ESTADOS_COTIZACION_COLORS[c.estado]}>{ESTADOS_COTIZACION_LABELS[c.estado]}</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fd-texto-muted)', marginTop: 4 }}>{new Date(c.created_at).toLocaleDateString('es-DO')}</div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--fd-azul)' }}>{fmt(c.total)}</span>
              </div>
              {cotActual?.id === c.id && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--fd-borde)' }}>
                  {(c.cotizacion_items || []).map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--fd-borde)' }}>
                      <span>{it.descripcion} × {it.cantidad}</span>
                      <span style={{ fontWeight: 600 }}>{fmt(it.subtotal)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <Btn size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); window.print() }}>🖨️ Imprimir</Btn>
                  </div>
                </div>
              )}
            </Card>
          ))
        }
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--fd-texto-muted)' }}>
          ¿Tienes preguntas? {EMPRESA.whatsappDisplay} · {EMPRESA.email}
        </div>
      </div>
    </div>
  )
}
