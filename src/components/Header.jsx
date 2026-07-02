import bfxLogo from '../assets/bfx_logo.svg';

const PAGE_TITLES = {
  dashboard:      { title: 'Dashboard', sub: 'Validación de Producto Final' },
  eficienciaOperador: { title: 'Eficiencia operador', sub: 'Tarimas creadas, turnos e incidencias' },
  verificaciones: { title: 'Verificaciones', sub: 'Gestión de tarimas y cajas' },
  auditoria:      { title: 'Auditoria', sub: 'Trazabilidad de defectos' },
  analisisProducto: { title: 'Analisis de Calidad por Producto', sub: 'Producto terminado critico' },
  reportes:       { title: 'Reportes', sub: 'Análisis y métricas históricas' },
  configuracion:  { title: 'Configuración', sub: 'Preferencias del sistema' },
};

export default function Header({ activePage, period, onPeriod, accent }) {
  const PERIODS  = ['Hoy', 'Mes'];
  const { title, sub } = PAGE_TITLES[activePage] || PAGE_TITLES.dashboard;

  return (
    <div className="app-header" style={{
      background: 'var(--bx-card)', borderBottom: '1px solid var(--bx-border)', padding: '0 20px',
      height: 48, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexShrink: 0, gap: 12,
    }}>
      <div className="app-header-title" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <img
          src={bfxLogo}
          alt="Bioflex"
          style={{ width: 92, height: 28, objectFit: 'contain', flexShrink: 0 }}
        />
        <span style={{ width: 1, height: 24, background: 'var(--bx-border)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--bx-green-900)' }}>{title}</span>
        <span style={{ color: 'var(--bx-teal-500)' }}>›</span>
        <span style={{ fontSize: 12, color: 'var(--bx-muted)' }}>{sub}</span>
        <div style={{ marginLeft: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <div className="dot-live" />
          <span style={{ fontSize: 10, color: 'var(--bx-success)', fontWeight: 700 }}>En vivo</span>
        </div>
      </div>

      <div className="app-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {(activePage === 'dashboard' || activePage === 'eficienciaOperador') && (
          <>
            <span style={{ fontSize: 11, color: 'var(--bx-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0 }}>Periodo:</span>
            {PERIODS.map(p => (
              <button
                key={p}
                className={`filter-btn ${period === p ? 'active' : ''}`}
                style={{ background: period === p ? accent : undefined, borderColor: period === p ? accent : undefined }}
                onClick={() => onPeriod(p)}
              >{p}</button>
            ))}
          </>
        )}
       
      </div>
    </div>
  );
}
