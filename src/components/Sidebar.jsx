import {
  LayoutDashboard, CheckSquare, AlertTriangle,
  BarChart2, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';

const ITEMS = [
  { id: "dashboard",       label: "Dashboard",      Icon: LayoutDashboard },
  { id: "verificaciones",  label: "Verificaciones", Icon: CheckSquare },
  { id: "hallazgos",       label: "Hallazgos",      Icon: AlertTriangle },
  { id: "reportes",        label: "Reportes",       Icon: BarChart2 },
  { id: "configuracion",   label: "Configuración",  Icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, activePage, onNav, accent, bg }) {
  return (
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : 'expanded'}`}
      style={{ background: bg, display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* Logo row */}
      <div style={{
        height: 44, display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0 12px' : '0 12px 0 16px',
        borderBottom: '1px solid rgba(255,255,255,.08)', flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 24, height: 24, background: accent, borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 12, color: '#fff', letterSpacing: -0.5,
            }}>B</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: 0.2 }}>Bioflex</span>
          </div>
        )}
        <button
          onClick={onToggle}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A19F9D', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,.3)', padding: '14px 16px 6px' }}>
          Menú principal
        </div>
      )}

      <nav style={{ flex: 1, padding: '4px 6px', overflowY: 'auto' }}>
        {ITEMS.map(({ id, label, Icon }) => {
          const isActive = activePage === id;
          return (
            <div
              key={id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{
                justifyContent: collapsed ? 'center' : undefined,
                padding: collapsed ? '9px 0' : undefined,
                background: isActive ? accent : undefined,
              }}
              onClick={() => onNav(id)}
            >
              <Icon size={15} color={isActive ? '#fff' : '#C8C6C4'} />
              {!collapsed && <span>{label}</span>}
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '8px 6px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <div className="nav-item" style={{ justifyContent: collapsed ? 'center' : undefined }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', background: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>AD</div>
          {!collapsed && (
            <div>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Admin</div>
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10 }}>admin@bioflex.mx</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
