import { RefreshCw } from 'lucide-react';

const PAGE_TITLES = {
  dashboard:      { title: 'Dashboard', sub: 'Validación de Producto Final' },
  verificaciones: { title: 'Verificaciones', sub: 'Gestión de tarimas y cajas' },
  hallazgos:      { title: 'Hallazgos', sub: 'Seguimiento de no conformidades' },
  reportes:       { title: 'Reportes', sub: 'Análisis y métricas históricas' },
  configuracion:  { title: 'Configuración', sub: 'Preferencias del sistema' },
};

export default function Header({ activePage, period, onPeriod, accent }) {
  const PERIODS  = ['Hoy', 'Semana', 'Mes'];
  const { title, sub } = PAGE_TITLES[activePage] || PAGE_TITLES.dashboard;

  return (
    <div style={{
      background: '#fff', borderBottom: '1px solid #EDEBE9', padding: '0 20px',
      height: 48, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexShrink: 0, gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#252423' }}>{title}</span>
        <span style={{ color: '#C8C6C4' }}>›</span>
        <span style={{ fontSize: 12, color: '#605E5C' }}>{sub}</span>
        <div style={{ marginLeft: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <div className="dot-live" />
          <span style={{ fontSize: 10, color: '#107C10', fontWeight: 600 }}>En vivo</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {activePage === 'dashboard' && (
          <>
            <span style={{ fontSize: 11, color: '#A19F9D', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>Periodo:</span>
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
        <button className="filter-btn" title="Actualizar" style={{ padding: '5px 8px' }}>
          <RefreshCw size={13} />
        </button>
      </div>
    </div>
  );
}
