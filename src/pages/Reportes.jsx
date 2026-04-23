import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Download, TrendingUp, Users, Package, AlertTriangle } from 'lucide-react';
import CustomTooltip from '../components/CustomTooltip';
import { reportesData } from '../data/mockData';

const SEV_COLOR = { 'CRÍTICO': '#A80000', 'MAYOR': '#F2C812', 'MENOR': '#0078D4' };

export default function Reportes({ accent }) {
  const { resumenMensual, porCliente, inspectores } = reportesData;

  return (
    <div className="main-scroll" style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Section: Resumen mensual */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#252423' }}>Resumen del Período</div>
          <div style={{ fontSize: 11, color: '#A19F9D' }}>Sep 2025 – Feb 2026</div>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 4, border: '1px solid #EDEBE9',
          background: '#fff', color: '#252423', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>
          <Download size={13} /> Exportar PDF
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Total tarimas',    value: resumenMensual.reduce((s,r)=>s+r.tarimas,0).toLocaleString(), icon: <Package size={16} color={accent} />,             accent },
          { label: 'Total cajas',      value: resumenMensual.reduce((s,r)=>s+r.cajas,0).toLocaleString(),   icon: <Package size={16} color="#00B7C3" />,             accent: '#00B7C3' },
          { label: 'Total hallazgos',  value: resumenMensual.reduce((s,r)=>s+r.hallazgos,0),                icon: <AlertTriangle size={16} color="#A80000" />,        accent: '#A80000' },
          { label: 'Tasa aprobación',  value: `${(resumenMensual.reduce((s,r)=>s+r.aprobacion,0)/resumenMensual.length).toFixed(1)}%`,
                                                                                                             icon: <TrendingUp size={16} color="#107C10" />,           accent: '#107C10', color: '#107C10' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '12px 14px', borderTop: `3px solid ${k.accent}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value" style={{ marginTop: 4, color: k.color || '#252423' }}>{k.value}</div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 4, background: `${k.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {k.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 10 }}>

        {/* Tendencia mensual */}
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#252423', marginBottom: 2 }}>Evolución de Tarimas y Hallazgos</div>
          <div style={{ fontSize: 10, color: '#A19F9D', marginBottom: 10 }}>Últimos 6 meses</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={resumenMensual} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left"  dataKey="tarimas"   name="Tarimas"   fill={accent}   radius={[3,3,0,0]} />
              <Bar yAxisId="left"  dataKey="cajas"     name="Cajas"     fill="#00B7C3"  radius={[3,3,0,0]} />
              <Bar yAxisId="right" dataKey="hallazgos" name="Hallazgos" fill="#A80000"  radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 4 }}>
            {[['Tarimas', accent], ['Cajas', '#00B7C3'], ['Hallazgos', '#A80000']].map(([l, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#605E5C' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
              </div>
            ))}
          </div>
        </div>

        {/* Tasa de aprobación */}
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#252423', marginBottom: 2 }}>Tasa de Aprobación</div>
          <div style={{ fontSize: 10, color: '#A19F9D', marginBottom: 10 }}>% mensual</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={resumenMensual} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[96, 100]} tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Line dataKey="aprobacion" name="% Aprobación" stroke="#107C10" strokeWidth={2.5} dot={{ fill: '#107C10', r: 4 }} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* By Client */}
      <div className="card" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#252423', marginBottom: 10 }}>Desempeño por Cliente</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Cliente</th>
                <th style={{ textAlign: 'right' }}>Tarimas</th>
                <th style={{ textAlign: 'right' }}>Cajas</th>
                <th style={{ textAlign: 'right' }}>Hallazgos</th>
                <th style={{ textAlign: 'right' }}>Tasa Aprobación</th>
                <th>Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {porCliente.map(r => (
                <tr key={r.cliente}>
                  <td style={{ fontWeight: 600, fontSize: 12 }}>{r.cliente}</td>
                  <td style={{ textAlign: 'right', fontSize: 12 }}>{r.tarimas.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontSize: 12 }}>{r.cajas.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`badge ${r.hallazgos > 20 ? 'badge-critical' : r.hallazgos > 10 ? 'badge-major' : 'badge-minor'}`}>
                      {r.hallazgos}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      <div style={{ width: 80, background: '#F3F2F1', borderRadius: 2, height: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${((r.aprobacion - 95) / 5) * 100}%`, background: r.aprobacion >= 99 ? '#107C10' : r.aprobacion >= 98 ? accent : '#F2C812', height: '100%', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: r.aprobacion >= 99 ? '#107C10' : r.aprobacion >= 98 ? accent : '#F2C812', minWidth: 44 }}>
                        {r.aprobacion}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="trend-up">▲ 0.3%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Inspector */}
      <div className="card" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#252423', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={14} /> Desempeño por Inspector
        </div>
        <div style={{ fontSize: 10, color: '#A19F9D', marginBottom: 10 }}>Período completo</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Inspector</th>
                <th style={{ textAlign: 'right' }}>Verificaciones</th>
                <th style={{ textAlign: 'right' }}>Hallazgos</th>
                <th style={{ textAlign: 'right' }}>Prom. días verif.</th>
                <th style={{ textAlign: 'right' }}>Tasa Aprobación</th>
              </tr>
            </thead>
            <tbody>
              {inspectores.map(i => (
                <tr key={i.nombre}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', background: accent,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {i.nombre.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 12 }}>{i.nombre}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontSize: 12 }}>{i.verificaciones}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`badge ${i.hallazgos > 12 ? 'badge-major' : 'badge-minor'}`}>{i.hallazgos}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontSize: 12 }}>{i.promDias}d</td>
                  <td style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: i.tasa >= 99 ? '#107C10' : accent }}>{i.tasa}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 8px', fontSize: 10, color: '#C8C6C4' }}>
        <span>Bioflex · Calidad Comercial</span>
        <span>Reportes v2.0 · Período Sep 2025 – Feb 2026</span>
      </div>
    </div>
  );
}
