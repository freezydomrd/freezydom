// ============================================================
// Componentes UI reutilizables de FreezyDom
// ============================================================

// --- BOTÓN ---
export function Btn({ children, variant = 'primary', size = 'md', onClick, type = 'button', disabled, style = {} }) {
  const base = { border: 'none', borderRadius: 'var(--fd-radio)', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'Arial, sans-serif', fontWeight: 600, transition: 'opacity 0.15s', opacity: disabled ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', ...style }
  const variants = {
    primary:  { background: 'var(--fd-azul)',    color: '#fff',              padding: size === 'sm' ? '6px 12px' : '9px 18px', fontSize: size === 'sm' ? 13 : 14 },
    secondary:{ background: 'var(--fd-azul-claro)', color: 'var(--fd-azul)', padding: size === 'sm' ? '6px 12px' : '9px 18px', fontSize: size === 'sm' ? 13 : 14 },
    danger:   { background: '#fff0f0',            color: 'var(--fd-error)',   padding: size === 'sm' ? '6px 12px' : '9px 18px', fontSize: size === 'sm' ? 13 : 14 },
    ghost:    { background: 'transparent',        color: 'var(--fd-texto-muted)', padding: size === 'sm' ? '6px 12px' : '9px 18px', fontSize: size === 'sm' ? 13 : 14 },
  }
  return <button type={type} style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>{children}</button>
}

// --- CARD ---
export function Card({ children, style = {}, padding = true }) {
  return (
    <div style={{ background: '#fff', borderRadius: 'var(--fd-radio-lg)', border: '1px solid var(--fd-borde)', boxShadow: 'var(--fd-sombra)', padding: padding ? '20px' : 0, ...style }}>
      {children}
    </div>
  )
}

// --- INPUT ---
export function Input({ label, error, style = {}, ...props }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 5 }}>{label}</label>}
      <input style={{ width: '100%', padding: '9px 12px', border: `1px solid ${error ? 'var(--fd-error)' : 'var(--fd-borde)'}`, borderRadius: 'var(--fd-radio)', fontSize: 14, outline: 'none', background: '#fafcff', boxSizing: 'border-box' }} {...props} />
      {error && <span style={{ fontSize: 12, color: 'var(--fd-error)', marginTop: 3, display: 'block' }}>{error}</span>}
    </div>
  )
}

// --- SELECT ---
export function Select({ label, error, children, style = {}, ...props }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 5 }}>{label}</label>}
      <select style={{ width: '100%', padding: '9px 12px', border: `1px solid ${error ? 'var(--fd-error)' : 'var(--fd-borde)'}`, borderRadius: 'var(--fd-radio)', fontSize: 14, outline: 'none', background: '#fafcff', boxSizing: 'border-box' }} {...props}>
        {children}
      </select>
      {error && <span style={{ fontSize: 12, color: 'var(--fd-error)', marginTop: 3, display: 'block' }}>{error}</span>}
    </div>
  )
}

// --- TEXTAREA ---
export function Textarea({ label, error, style = {}, ...props }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 5 }}>{label}</label>}
      <textarea style={{ width: '100%', padding: '9px 12px', border: `1px solid ${error ? 'var(--fd-error)' : 'var(--fd-borde)'}`, borderRadius: 'var(--fd-radio)', fontSize: 14, outline: 'none', background: '#fafcff', boxSizing: 'border-box', resize: 'vertical', minHeight: 80 }} {...props} />
      {error && <span style={{ fontSize: 12, color: 'var(--fd-error)', marginTop: 3, display: 'block' }}>{error}</span>}
    </div>
  )
}

// --- BADGE ---
export function Badge({ children, color = '#1A6DB5' }) {
  const bg = color + '18'
  return <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, background: bg, color, fontSize: 12, fontWeight: 600 }}>{children}</span>
}

// --- MODAL ---
export function Modal({ abierto, onClose, titulo, children, ancho = 480 }) {
  if (!abierto) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 'var(--fd-radio-lg)', width: '100%', maxWidth: ancho, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', animation: 'fadeIn 0.18s ease-out' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--fd-borde)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--fd-texto)' }}>{titulo}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--fd-texto-muted)', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  )
}

// --- ALERTA ---
export function Alerta({ tipo = 'info', children }) {
  const colores = { info: '#1A6DB5', exito: '#2e7d32', error: '#c62828', advertencia: '#e65100' }
  const color = colores[tipo]
  return (
    <div style={{ background: color + '12', border: `1px solid ${color}30`, borderRadius: 'var(--fd-radio)', padding: '10px 14px', color, fontSize: 13, marginBottom: 14 }}>
      {children}
    </div>
  )
}

// --- CARGANDO ---
export function Cargando({ texto = 'Cargando...' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--fd-azul-claro)', borderTop: '3px solid var(--fd-azul)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--fd-texto-muted)', fontSize: 14 }}>{texto}</span>
    </div>
  )
}

// --- PÁGINA HEADER ---
export function PageHeader({ titulo, subtitulo, accion }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--fd-texto)', margin: 0 }}>{titulo}</h1>
        {subtitulo && <p style={{ fontSize: 13, color: 'var(--fd-texto-muted)', marginTop: 4 }}>{subtitulo}</p>}
      </div>
      {accion && <div>{accion}</div>}
    </div>
  )
}

// --- STAT CARD ---
export function StatCard({ icono, label, valor, color = 'var(--fd-azul)', sub }) {
  return (
    <div style={{ background: '#fff', borderRadius: 'var(--fd-radio-lg)', border: '1px solid var(--fd-borde)', padding: '18px 20px', boxShadow: 'var(--fd-sombra)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icono}</div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--fd-texto)', lineHeight: 1.2 }}>{valor}</div>
          <div style={{ fontSize: 13, color: 'var(--fd-texto-muted)' }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color, marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  )
}

// --- TABLA ---
export function Tabla({ columnas, datos, onFila, vacio = 'Sin registros' }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--fd-radio)', border: '1px solid var(--fd-borde)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#f5f9ff' }}>
            {columnas.map((col, i) => (
              <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--fd-texto-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', borderBottom: '1px solid var(--fd-borde)' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.length === 0
            ? <tr><td colSpan={columnas.length} style={{ padding: 32, textAlign: 'center', color: 'var(--fd-texto-muted)' }}>{vacio}</td></tr>
            : datos.map((fila, i) => (
              <tr key={i} onClick={() => onFila?.(fila)} style={{ borderBottom: '1px solid var(--fd-borde)', cursor: onFila ? 'pointer' : 'default', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (onFila) e.currentTarget.style.background = '#f5f9ff' }}
                onMouseLeave={e => { e.currentTarget.style.background = '' }}>
                {Object.values(fila).map((cel, j) => (
                  <td key={j} style={{ padding: '10px 14px', color: 'var(--fd-texto)', verticalAlign: 'middle' }}>{cel}</td>
                ))}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}

// --- TOGGLE ACTIVO ---
export function ToggleActivo({ activo, onChange }) {
  return (
    <button onClick={onChange} style={{ width: 40, height: 22, borderRadius: 11, background: activo ? 'var(--fd-azul)' : '#ccc', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: activo ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </button>
  )
}
