import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../components/auth/AuthContext'
import { StatCard, Card, PageHeader, Cargando, Badge } from '../../components/ui/index.jsx'
import { ESTADOS_COTIZACION_COLORS, ESTADOS_COTIZACION_LABELS, EMPRESA } from '../../lib/constants'

export default function AdminDashboard() {
  const { perfil } = useAuth()
  const [stats, setStats] = useState(null)
  const [recientes, setRecientes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const [{ count: totalClientes }, { count: totalCotizaciones }, { count: totalEquipos }, cotizaciones] = await Promise.all([
      supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('cotizaciones').select('*', { count: 'exact', head: true }),
      supabase.from('equipos').select('*', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('cotizaciones').select('id, numero, estado, total, created_at, clientes(nombre)').order('created_at', { ascending: false }).limit(5),
    ])
    const { data: ingresos } = await supabase.from('cotizaciones').select('total').eq('estado', 'aprobada')
    const totalIngresos = (ingresos || []).reduce((s, c) => s + Number(c.total), 0)
    setStats({ totalClientes: totalClientes || 0, totalCotizaciones: totalCotizaciones || 0, totalEquipos: totalEquipos || 0, totalIngresos })
    setRecientes(cotizaciones.data || [])
    setCargando(false)
  }

  const fmt = n => 'RD$ ' + Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })

  if (cargando) return <Cargando texto="Cargando dashboard..." />

  return (
    <div className="fade-in">
      <PageHeader titulo={`¡Bienvenido, ${perfil?.nombre?.split(' ')[0]}! 👋`} subtitulo={`${EMPRESA.nombre} · ${EMPRESA.ciudad}`} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icono="👥" label="Clientes activos" valor={stats.totalClientes} color="#1A6DB5" />
        <StatCard icono="📋" label="Cotizaciones" valor={stats.totalCotizaciones} color="#6d3bb5" />
        <StatCard icono="❄️" label="Equipos activos" valor={stats.totalEquipos} color="#1ab58a" />
        <StatCard icono="💰" label="Ingresos aprobados" valor={fmt(stats.totalIngresos)} color="#e65100" />
      </div>

      <Card>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16, color: 'var(--fd-texto)' }}>Cotizaciones recientes</div>
        {recientes.length === 0
          ? <p style={{ color: 'var(--fd-texto-muted)', fontSize: 14 }}>No hay cotizaciones aún.</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recientes.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--fd-borde)', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--fd-azul)', marginRight: 8 }}>{c.numero}</span>
                    <span style={{ fontSize: 13, color: 'var(--fd-texto)' }}>{c.clientes?.nombre}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(c.total)}</span>
                    <Badge color={ESTADOS_COTIZACION_COLORS[c.estado]}>{ESTADOS_COTIZACION_LABELS[c.estado]}</Badge>
                  </div>
                </div>
              ))}
            </div>
        }
      </Card>
    </div>
  )
}
