import { useState } from 'react';
import './index.css';
import Sidebar       from './components/Sidebar';
import Header        from './components/Header';
import Dashboard     from './pages/Dashboard';
import Verificaciones from './pages/Verificaciones';
import Hallazgos     from './pages/Hallazgos';
import Reportes      from './pages/Reportes';
import Configuracion from './pages/Configuracion';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePage,       setActivePage]       = useState('dashboard');
  const [period,           setPeriod]           = useState('Mes');
  const [cliente,          setCliente]          = useState('Todos');
  const [accent,           setAccent]           = useState('#0078D4');
  const [sidebarColor,     setSidebarColor]     = useState('#252423');

  const PAGE = {
    dashboard:      <Dashboard      accent={accent} />,
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
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>Última actualización: Hoy 09:14 AM</span>
        </div>

        <Header
          activePage={activePage}
          period={period}
          onPeriod={setPeriod}
          cliente={cliente}
          onCliente={setCliente}
          accent={accent}
        />

        <div className="main-scroll">
          {PAGE[activePage] || PAGE.dashboard}
        </div>
      </div>
    </div>
  );
}
