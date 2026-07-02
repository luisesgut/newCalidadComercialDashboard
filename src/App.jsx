import { useState } from 'react';
import './index.css';
import Sidebar       from './components/Sidebar';
import Header        from './components/Header';
import MaintenanceScreen from './components/MaintenanceScreen';
import Dashboard     from './pages/Dashboard';
import EficienciaOperador from './pages/EficienciaOperador';
import { DashboardFilterProvider } from './context/DashboardFilterContext';
import Verificaciones from './pages/Verificaciones';
import AuditoriaDefectos from './pages/AuditoriaDefectos';
import AnalisisProducto from './pages/AnalisisProducto';
import Reportes      from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import { MAINTENANCE_MODE } from './middleware/maintenanceMode';

const fmtDate = (date) => date.toISOString().slice(0, 10);
const MIN_DASHBOARD_DATE = '2026-07-01';

function getPeriodRange(period) {
  const today = new Date();
  const end = fmtDate(today);

  if (period === 'Hoy') {
    return { desde: end, hasta: end };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const desde = fmtDate(start);
  return { desde: desde < MIN_DASHBOARD_DATE ? MIN_DASHBOARD_DATE : desde, hasta: end };
}

function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePage,       setActivePage]       = useState('dashboard');
  const [period,           setPeriod]           = useState('Mes');
  const [accent,           setAccent]           = useState('#26575B');
  const [sidebarColor,     setSidebarColor]     = useState('#1D3D3A');
  const range = getPeriodRange(period);

  const PAGE = {
    dashboard:      <DashboardFilterProvider key={`dashboard-${period}`}><Dashboard accent={accent} initialDesde={range.desde} initialHasta={range.hasta} /></DashboardFilterProvider>,
    eficienciaOperador: <EficienciaOperador key={`eficiencia-operador-${period}`} accent={accent} initialDesde={range.desde} initialHasta={range.hasta} />,
    verificaciones: <Verificaciones accent={accent} />,
    auditoria:      <AuditoriaDefectos accent={accent} />,
    analisisProducto: <AnalisisProducto accent={accent} />,
    reportes:       <Reportes       accent={accent} />,
    configuracion:  <Configuracion  accent={accent} onAccentChange={setAccent} sidebarColor={sidebarColor} onSidebarChange={setSidebarColor} />,
  };

  return (
    <div className="app-shell" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        activePage={activePage}
        onNav={setActivePage}
        accent={accent}
        bg={sidebarColor}
      />

      <div className="app-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Power BI top bar */}
        <div
          className="pbi-header"
          style={{ background: sidebarColor, borderBottomColor: accent }}
        >
          <div style={{ width: 8, height: 8, borderRadius: 2, background: accent }} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>Calidad Comercial</span>
          <div style={{ flex: 1 }} />
        </div>

        <Header
          activePage={activePage}
          period={period}
          onPeriod={setPeriod}
          accent={accent}
        />

        <div className="main-scroll">
          {PAGE[activePage] || PAGE.dashboard}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return MAINTENANCE_MODE ? <MaintenanceScreen /> : <AppShell />;
}
