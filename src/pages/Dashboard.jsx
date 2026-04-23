import { useState, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Package, TrendingUp, Clock, Camera, CheckSquare, BarChart2
} from 'lucide-react';
import KPICard from '../components/KPICard';
import CustomTooltip from '../components/CustomTooltip';
import {
  kpiData, costoCliente, tarimasMes, paretoDefectos,
  familiasProductos, familiasErrores, tendencia, verificaciones,
  COLORS_PIE,
} from '../data/mockData';

export default function Dashboard({ accent }) {
  const [tabVerif, setTabVerif] = useState('todas');

  const filteredVerif = useMemo(() => {
    if (tabVerif === 'activas')  return verificaciones.filter(v => v.estado === 'EN PROCESO');
    if (tabVerif === 'cerradas') return verificaciones.filter(v => v.estado === 'TERMINADO');
    return verificaciones;
  }, [tabVerif]);

  return (
    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* KPIs Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <KPICard label="Tarimas Hoy"           value={kpiData.tarimasHoy.toLocaleString()}          sub={`${kpiData.tarimasSemana.toLocaleString()} esta semana`}        trend={12.5} trendUp icon={Package}    accent={accent} />
        <KPICard label="Tarimas del Mes"        value={kpiData.tarimasMes.toLocaleString()}           sub={`${kpiData.tarimasRechazadasMes} rechazadas`}                   trend={8.3}  trendUp icon={Package}    accent="#00B7C3" />
        <KPICard label="Tasa Aprobación"        value={`${kpiData.tasaAprobacionTarimas}%`}           sub={`${kpiData.tasaAprobacionCajas}% cajas`}                        trend={2.1}  trendUp icon={TrendingUp} accent="#107C10" color="#107C10" />
        <KPICard label="Verificaciones Activas" value={kpiData.verificacionesActivas}                 sub="En proceso ahora"                                                             icon={Clock}     accent="#F2C812" color="#7A4F01" />
      </div>

      {/* KPIs Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <KPICard label="Cajas Hoy"       value={kpiData.cajasHoy.toLocaleString()}                   sub={`${kpiData.cajasSemana.toLocaleString()} semana`}               trend={15.2} trendUp icon={Package}    accent="#8B5CF6" />
        <KPICard label="Cerradas Hoy"    value={kpiData.verificacionesCerradasHoy}                    sub={`${kpiData.verificacionesCerradasMes} este mes`}                trend={5.4}  trendUp icon={CheckSquare} accent="#107C10" />
        <KPICard label="Fotos Registradas" value={kpiData.totalFotos.toLocaleString()}                sub={`${kpiData.avgFotos} por verificación`}                                       icon={Camera}    accent={accent} />
        <KPICard label="Promedio Diario" value={kpiData.promedioVerifDiario.toFixed(1)}               sub={`${kpiData.promedioVerifSemanal.toFixed(1)} semanal`}           trend={3.2}  trendUp icon={BarChart2}  accent="#00B7C3" />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Verificaciones por Cliente */}
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#252423', marginBottom: 2 }}>Verificaciones por Cliente</div>
          <div style={{ fontSize: 10, color: '#A19F9D', marginBottom: 10 }}>Total, activas y cerradas</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={costoCliente} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
              <XAxis dataKey="cliente" tick={{ fill: '#A19F9D', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total"    name="Total ($)"  fill={accent}    radius={[3,3,0,0]} />
              <Bar dataKey="activas"  name="Activas"    fill="#00B7C3"   radius={[3,3,0,0]} />
              <Bar dataKey="cerradas" name="Cerradas"   fill="#107C10"   radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 4 }}>
            {[['Total ($)', accent], ['Activas', '#00B7C3'], ['Cerradas', '#107C10']].map(([l, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#605E5C' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
              </div>
            ))}
          </div>
        </div>

        {/* Tarimas Mes */}
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#252423', marginBottom: 2 }}>Tarimas Verificadas vs Rechazadas</div>
          <div style={{ fontSize: 10, color: '#A19F9D', marginBottom: 10 }}>Evolución mensual Oct 25 – Feb 26</div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={tarimasMes} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
              <XAxis dataKey="periodo" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar  dataKey="verificadas" name="Verificadas" fill={accent}   radius={[3,3,0,0]} barSize={22} />
              <Line dataKey="rechazadas"  name="Rechazadas"  stroke="#A80000" strokeWidth={2} dot={{ fill: '#A80000', r: 3 }} type="monotone" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 10 }}>

        {/* Tendencia */}
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#252423', marginBottom: 2 }}>Tendencia Aprobación</div>
          <div style={{ fontSize: 10, color: '#A19F9D', marginBottom: 10 }}>Últimos 6 meses</div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={tendencia} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradAprobadas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="10%" stopColor={accent} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="aprobadas"  name="Aprobadas"  stroke={accent}   strokeWidth={2} fill="url(#gradAprobadas)" />
              <Area type="monotone" dataKey="rechazadas" name="Rechazadas" stroke="#A80000"  strokeWidth={2} fill="none" strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución por Cliente */}
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#252423', marginBottom: 2 }}>Distribución por Cliente</div>
          <div style={{ fontSize: 10, color: '#A19F9D', marginBottom: 6 }}>Participación de verificaciones</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 110, height: 110, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={familiasProductos} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="cantidad" strokeWidth={2} stroke="#fff">
                    {familiasProductos.map((_, i) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1 }}>
              {familiasProductos.map((item, i) => (
                <div key={item.nombre} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS_PIE[i % COLORS_PIE.length] }} />
                      <span style={{ fontSize: 10, color: '#605E5C' }}>{item.nombre}</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#252423' }}>{item.porcentaje}%</span>
                  </div>
                  <div className="prog-bar-bg">
                    <div className="prog-bar-fill" style={{ width: `${item.porcentaje}%`, background: COLORS_PIE[i % COLORS_PIE.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Familias de Defectos */}
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#252423', marginBottom: 2 }}>Familias de Defectos</div>
          <div style={{ fontSize: 10, color: '#A19F9D', marginBottom: 10 }}>Clasificación por tipo</div>
          {familiasErrores.map(item => {
            const total = familiasErrores.reduce((s, x) => s + x.cantidad, 0);
            const pct = Math.round((item.cantidad / total) * 100);
            return (
              <div key={item.nombre} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                    <span style={{ fontSize: 10, color: '#605E5C' }}>{item.nombre}</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#252423' }}>
                    {item.cantidad} <span style={{ color: '#A19F9D', fontWeight: 400 }}>({pct}%)</span>
                  </span>
                </div>
                <div className="prog-bar-bg">
                  <div className="prog-bar-fill" style={{ width: `${pct}%`, background: item.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pareto */}
      <div className="card" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#252423', marginBottom: 2 }}>Pareto de Defectos</div>
        <div style={{ fontSize: 10, color: '#A19F9D', marginBottom: 10 }}>Top defectos por frecuencia — los 3 primeros representan el 65% del total</div>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={paretoDefectos} layout="vertical" margin={{ top: 0, right: 40, left: 130, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="defecto" tick={{ fill: '#605E5C', fontSize: 10 }} axisLine={false} tickLine={false} width={125} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cantidad" name="Frecuencia" radius={[0,3,3,0]} barSize={14}>
              {paretoDefectos.map((_, i) => <Cell key={i} fill={i < 3 ? '#A80000' : accent} />)}
            </Bar>
            <Line dataKey="cum" name="% Acumulado" stroke="#F2C812" strokeWidth={2} dot={{ fill: '#F2C812', r: 3 }} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 4, justifyContent: 'flex-end' }}>
          {[['#A80000', 'Top 3 críticos'], [accent, 'Otros'], ['#F2C812', '% Acumulado', true]].map(([c, l, line]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#605E5C' }}>
              {line
                ? <div style={{ width: 10, height: 3, background: c }} />
                : <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
              }
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Verificaciones Table */}
      <div className="card" style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#252423' }}>Verificaciones Recientes</div>
            <div style={{ fontSize: 10, color: '#A19F9D' }}>Listado con estado y fotos registradas</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 10, background: '#FFF4CE', color: '#7A4F01', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
              {verificaciones.filter(v => v.estado === 'EN PROCESO').length} activas
            </span>
            <span style={{ fontSize: 10, background: '#DFF6DD', color: '#107C10', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
              {verificaciones.filter(v => v.estado === 'TERMINADO').length} cerradas
            </span>
          </div>
        </div>

        <div className="tab-bar" style={{ marginBottom: 10 }}>
          {[['todas','Todas'], ['activas','En Proceso'], ['cerradas','Terminadas']].map(([k, l]) => (
            <div key={k}
              className={`tab ${tabVerif === k ? 'active' : ''}`}
              style={{ borderBottomColor: tabVerif === k ? accent : undefined, color: tabVerif === k ? accent : undefined }}
              onClick={() => setTabVerif(k)}
            >{l}</div>
          ))}
        </div>

        <div style={{ overflowX: 'auto', maxHeight: 240, overflowY: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th><th>Lote</th><th>Cliente</th><th>Producto</th>
                <th>Inspector</th><th>Fecha</th><th>Estado</th><th>Fotos</th><th>Hallazgos</th>
              </tr>
            </thead>
            <tbody>
              {filteredVerif.map(v => (
                <tr key={v.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: accent, fontWeight: 700 }}>#{String(v.id).padStart(4, '0')}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{v.lote}</td>
                  <td style={{ fontWeight: 600, fontSize: 12 }}>{v.cliente}</td>
                  <td style={{ fontSize: 11, color: '#605E5C' }}>{v.producto}</td>
                  <td style={{ fontSize: 11 }}>{v.inspector}</td>
                  <td style={{ fontSize: 11, color: '#A19F9D' }}>{v.fecha}</td>
                  <td>
                    <span className={`badge ${v.estado === 'EN PROCESO' ? 'badge-active' : 'badge-done'}`}>
                      {v.estado === 'EN PROCESO' ? '● En proceso' : '✓ Terminado'}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#605E5C' }}>
                      📷 {v.fotos}
                    </span>
                  </td>
                  <td>
                    {v.hallazgos > 0
                      ? <span className={`badge ${v.hallazgos >= 2 ? 'badge-critical' : 'badge-major'}`}>{v.hallazgos}</span>
                      : <span style={{ color: '#A19F9D', fontSize: 11 }}>—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 8px', fontSize: 10, color: '#C8C6C4' }}>
        <span>Bioflex · Calidad Comercial</span>
        <span>VPF Dashboard v2.0 · Oct 2025 – Feb 2026 · Última actualización: 23/04/2026</span>
      </div>
    </div>
  );
}
