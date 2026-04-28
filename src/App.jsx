import { useState } from 'react';
import './index.css';
import Sidebar       from './components/Sidebar';
import Header        from './components/Header';
import Dashboard     from './pages/Dashboard';
import Verificaciones from './pages/Verificaciones';
import Hallazgos     from './pages/Hallazgos';
import Reportes      from './pages/Reportes';
import Configuracion from './pages/Configuracion';

const fmtDate = (date) => date.toISOString().slice(0, 10);

function getPeriodRange(period) {
  const today = new Date();
  const end = fmtDate(today);

  if (period === 'Hoy') {
    return { desde: end, hasta: end };
  }

  if (period === 'Semana') {
    const start = new Date(today);
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    return { desde: fmtDate(start), hasta: end };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return { desde: fmtDate(start), hasta: end };
}

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePage,       setActivePage]       = useState('dashboard');
  const [period,           setPeriod]           = useState('Mes');
  const [accent,           setAccent]           = useState('#0078D4');
  const [sidebarColor,     setSidebarColor]     = useState('#252423');
  const range = getPeriodRange(period);

  const PAGE = {
    dashboard:      <Dashboard      key={`dashboard-${period}`} accent={accent} initialDesde={range.desde} initialHasta={range.hasta} />,
    verificaciones: <Verificaciones accent={accent} />,
    hallazgos:      <Hallazgos      accent={accent} />,
    reportes:       <Reportes       accent={accent} />,
    configuracion:  <Configuracion  accent={accent} onAccentChange={setAccent} sidebarColor={sidebarColor} onSidebarChange={setSidebarColor} />,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        activePage={activePage}
        onNav={setActivePage}
        accent={accent}
        bg={sidebarColor}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
