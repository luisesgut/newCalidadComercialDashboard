import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CalendarDays, ChevronDown, ChevronRight, HelpCircle, RefreshCw, Users } from 'lucide-react';
import { getDetalleInteractivo, getIncidenciasPorOperador, getTarimasPorDiaMes } from '../services/verificacionApi';

const today = new Date().toISOString().slice(0, 10);
const defaultDesde = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const EMPTY_ARRAY = [];
const CLIENTES = ['Quality', 'Destiny', 'Pollos Guerrero', 'Mr Lucky', 'Mayalatex'];
const STATUS_COLORS = {
  aprobadas: '#0078D4',
  hallazgos: '#F59E0B',
  desviadas: '#8B5CF6',
  rechazadas: '#A80000',
};

const fmt = (value, digits = 0) => Number(value || 0).toLocaleString('es-MX', {
  maximumFractionDigits: digits,
  minimumFractionDigits: digits,
});

const pct = (value) => `${fmt(value, 1)}%`;

const fmtDate = (value) => (
  value ? new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
);

function normalizeSemanaDesglose(semana = {}) {
  return {
    ...semana,
    etiqueta: `Sem. ${semana.semana}`,
    tarimasTotal: Number(semana.totalTarimas ?? semana.tarimasTotal ?? 0),
    tarimasAprobadas: Number(semana.aprobadas ?? semana.tarimasAprobadas ?? 0),
    tarimasConHallazgos: Number(semana.conHallazgos ?? semana.tarimasConHallazgos ?? 0),
    tarimasDesviadas: Number(semana.desviadas ?? semana.tarimasDesviadas ?? 0),
    tarimasRechazadas: Number(semana.rechazadas ?? semana.tarimasRechazadas ?? 0),
    tasaAprobacionReal: Number(semana.porcentajeAprobacionReal ?? semana.tasaAprobacionReal ?? 0),
  };
}

function CardTitle({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#252423', marginBottom: 2 }}>{title}</div>
        {sub && <div style={{ fontSize: 10, color: '#A19F9D' }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ text = 'Sin datos para el rango seleccionado' }) {
  return (
    <div style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A19F9D', fontSize: 12 }}>
      {text}
    </div>
  );
}

function HelpIcon({ text, open, onToggle }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Ver ayuda"
        style={{
          width: 22,
          height: 22,
          borderRadius: 4,
          border: '1px solid #EDEBE9',
          background: open ? '#F3F2F1' : '#fff',
          color: '#605E5C',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <HelpCircle size={13} />
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          zIndex: 30,
          top: 'calc(100% + 6px)',
          right: 0,
          width: 270,
          background: '#fff',
          border: '1px solid #EDEBE9',
          borderRadius: 4,
          boxShadow: '0 8px 22px rgba(0,0,0,.14)',
          padding: '9px 10px',
          fontSize: 11,
          lineHeight: 1.45,
          color: '#605E5C',
        }}>
          {text}
        </div>
      )}
    </span>
  );
}

function WeeklyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  return (
    <div className="custom-tooltip">
      <div className="label">{label} · {fmtDate(row.inicioSemana)}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="item">
          <div className="dot" style={{ background: p.color }} />
          <span>{p.name}: <strong>{fmt(p.value)}</strong></span>
        </div>
      ))}
      <div className="item"><span>Total: <strong>{fmt(row.tarimasTotal)}</strong></span></div>
      <div className="item"><span>Tasa real: <strong>{pct(row.tasaAprobacionReal)}</strong></span></div>
    </div>
  );
}

function heatColor(total) {
  if (total <= 0) return '#F3F2F1';
  if (total <= 5) return '#FEF3C7';
  if (total <= 10) return '#F59E0B';
  return '#B45309';
}

function textColor(total) {
  return total > 10 ? '#fff' : '#252423';
}

function eficienciaColor(value) {
  const tasa = Number(value || 0);
  if (tasa >= 90) return { bg: '#DFF6DD', color: '#107C10' };
  if (tasa >= 80) return { bg: '#FFF4CE', color: '#7A4F01' };
  return { bg: '#FDE7E9', color: '#A80000' };
}

export default function Hallazgos({ accent }) {
  const [desde, setDesde] = useState(defaultDesde);
  const [hasta, setHasta] = useState(today);
  const [cliente, setCliente] = useState('todos');
  const [tendencia, setTendencia] = useState(null);
  const [diaMes, setDiaMes] = useState(null);
  const [operadores, setOperadores] = useState(null);
  const [expandedOperador, setExpandedOperador] = useState(null);
  const [mesActivoIndex, setMesActivoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openHelp, setOpenHelp] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [tendenciaPayload, diaMesPayload, operadoresPayload] = await Promise.all([
        getDetalleInteractivo({ desde, hasta, cliente }),
        getTarimasPorDiaMes({ desde, hasta, cliente }),
        getIncidenciasPorOperador({ desde, hasta }),
      ]);
      setTendencia(tendenciaPayload);
      setDiaMes(diaMesPayload);
      setOperadores(operadoresPayload);
      setMesActivoIndex(0);
      setExpandedOperador(null);
    } catch (loadError) {
      setError(loadError.message);
      setTendencia(null);
      setDiaMes(null);
      setOperadores(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getDetalleInteractivo({ desde, hasta, cliente }),
      getTarimasPorDiaMes({ desde, hasta, cliente }),
      getIncidenciasPorOperador({ desde, hasta }),
    ])
      .then(([tendenciaPayload, diaMesPayload, operadoresPayload]) => {
        if (!ignore) {
          setTendencia(tendenciaPayload);
          setDiaMes(diaMesPayload);
          setOperadores(operadoresPayload);
          setMesActivoIndex(0);
          setExpandedOperador(null);
        }
      })
      .catch((loadError) => {
        if (!ignore) {
          setError(loadError.message);
          setTendencia(null);
          setDiaMes(null);
          setOperadores(null);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, [desde, hasta, cliente]);

  const semanas = useMemo(() => (
    (tendencia?.semanasDesglose || tendencia?.semanas || []).map(normalizeSemanaDesglose)
  ), [tendencia]);

  const diaMeses = Array.isArray(diaMes) ? diaMes : diaMes ? [diaMes] : EMPTY_ARRAY;
  const mesActivoSeguro = Math.min(mesActivoIndex, Math.max(diaMeses.length - 1, 0));
  const diaMesActivo = diaMeses[mesActivoSeguro] || null;
  const dias = diaMesActivo?.dias || EMPTY_ARRAY;
  const calendarCells = useMemo(() => {
    const firstDate = dias[0]?.fecha ? new Date(dias[0].fecha) : null;
    const startOffset = firstDate ? firstDate.getDay() : 0;
    return [
      ...Array.from({ length: startOffset }, (_, index) => ({ empty: true, key: `empty-${index}` })),
      ...dias.map((dia) => {
        const total = Number(dia.tarimasAprobadas || 0)
          + Number(dia.tarimasConHallazgos || 0)
          + Number(dia.tarimasDesviadas || 0)
          + Number(dia.tarimasRechazadas || 0);
        return { ...dia, total, key: `day-${dia.dia}` };
      }),
    ];
  }, [dias]);

  const activeDays = dias.filter((dia) => (
    Number(dia.tarimasAprobadas || 0)
    + Number(dia.tarimasConHallazgos || 0)
    + Number(dia.tarimasDesviadas || 0)
    + Number(dia.tarimasRechazadas || 0)
  ) > 0).length;

  const promedioActivo = activeDays ? Number(diaMesActivo?.totalMes || 0) / activeDays : 0;
  const reporteOperadores = useMemo(() => (
    (Array.isArray(operadores?.reporteOperadores) ? operadores.reporteOperadores : EMPTY_ARRAY)
      .map((operador) => ({
        ...operador,
        totalCajasRevisadas: Number(operador.totalCajasRevisadas || 0),
        totalCajasConDefecto: Number(operador.totalCajasConDefecto || 0),
        totalPiezasMermadas: Number(operador.totalPiezasMermadas || 0),
        tasaEficienciaEfectiva: Number(operador.tasaEficienciaEfectiva || 0),
        erroresMasDetectados: (Array.isArray(operador.erroresMasDetectados) ? operador.erroresMasDetectados : EMPTY_ARRAY)
          .map((errorItem) => ({
            ...errorItem,
            veces: Number(errorItem.veces || 0),
            piezasAfectadas: Number(errorItem.piezasAfectadas || 0),
          }))
          .sort((a, b) => b.piezasAfectadas - a.piezasAfectadas),
      }))
      .sort((a, b) => b.totalPiezasMermadas - a.totalPiezasMermadas)
  ), [operadores]);

  return (
    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#252423' }}>
          <CalendarDays size={15} color={accent} /> Analytics de hallazgos
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Desde
          <input className="pbi-input" type="date" value={desde} onChange={(event) => { setLoading(true); setMesActivoIndex(0); setExpandedOperador(null); setDesde(event.target.value); }} style={{ width: 140 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Hasta
          <input className="pbi-input" type="date" value={hasta} onChange={(event) => { setLoading(true); setMesActivoIndex(0); setExpandedOperador(null); setHasta(event.target.value); }} style={{ width: 140 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Cliente
          <select className="pbi-select" value={cliente} onChange={(event) => { setLoading(true); setMesActivoIndex(0); setCliente(event.target.value); }} style={{ minWidth: 160 }}>
            <option value="todos">Todos</option>
            {CLIENTES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button className="filter-btn" onClick={load} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} /> {loading ? 'Cargando' : 'Actualizar'}
        </button>
      </div>

      {error && <div style={{ background: '#FDE7E9', color: '#A80000', borderRadius: 4, padding: 8, fontSize: 11 }}>{error}</div>}

      <div className="card" style={{ padding: '12px 14px' }}>
        <CardTitle
          title="Rendimiento e incidencias por operador"
          sub="Cajas auditadas, piezas mermadas y errores mas detectados por persona"
          action={<Users size={15} color={accent} />}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 10, alignItems: 'stretch', marginBottom: 10 }}>
          <div className="card" style={{ boxShadow: 'none', border: '1px solid #EDEBE9', padding: '12px 14px', borderTop: `3px solid ${accent}` }}>
            <div className="kpi-label">Personal activo en el periodo</div>
            <div className="kpi-value" style={{ marginTop: 6 }}>{fmt(operadores?.totalOperadoresAuditados ?? reporteOperadores.length)}</div>
            <div className="kpi-sub">Operadoras y operarios con actividad</div>
          </div>
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderLeft: `4px solid ${accent}`, borderRadius: 4, padding: '10px 12px', fontSize: 12, color: '#1E3A8A', lineHeight: 1.5 }}>
            Esta vista permite evaluar el desempeño por persona en el rango seleccionado. Expande un operador para ver que familias y fallas especificas concentran mas piezas afectadas.
          </div>
        </div>

        {loading ? (
          <EmptyState text="Cargando rendimiento de operadores..." />
        ) : reporteOperadores.length ? (
          <div style={{ overflow: 'auto', maxHeight: 520 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 42 }} />
                  <th>Operador</th>
                  <th>Cajas totales escaneadas</th>
                  <th>Cajas con defectos</th>
                  <th>Piezas mermadas</th>
                  <th>Eficiencia efectiva</th>
                </tr>
              </thead>
              <tbody>
                {reporteOperadores.map((operador, index) => {
                  const rowKey = `${operador.usuarioOperador || 'operador'}-${index}`;
                  const expanded = expandedOperador === rowKey;
                  const badge = eficienciaColor(operador.tasaEficienciaEfectiva);
                  const maxPiezas = Math.max(...operador.erroresMasDetectados.map((item) => item.piezasAfectadas), 1);

                  return (
                    <Fragment key={rowKey}>
                      <tr key={rowKey} onClick={() => setExpandedOperador(expanded ? null : rowKey)}>
                        <td>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setExpandedOperador(expanded ? null : rowKey);
                            }}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 4,
                              border: '1px solid #EDEBE9',
                              background: expanded ? `${accent}18` : '#fff',
                              color: accent,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </td>
                        <td style={{ fontWeight: 700 }}>{operador.usuarioOperador || '-'}</td>
                        <td>{fmt(operador.totalCajasRevisadas)}</td>
                        <td>{fmt(operador.totalCajasConDefecto)}</td>
                        <td><strong style={{ color: '#A80000' }}>{fmt(operador.totalPiezasMermadas)}</strong></td>
                        <td>
                          <span className="badge" style={{ background: badge.bg, color: badge.color }}>
                            {pct(operador.tasaEficienciaEfectiva)}
                          </span>
                        </td>
                      </tr>
                      {expanded && (
                        <tr key={`${rowKey}-detalle`}>
                          <td colSpan={6} style={{ background: '#FAFAFA', padding: 10 }}>
                            {operador.erroresMasDetectados.length ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(260px, .8fr)', gap: 10 }}>
                                <div style={{ border: '1px solid #EDEBE9', borderRadius: 4, overflow: 'hidden' }}>
                                  <table className="tbl">
                                    <thead>
                                      <tr>
                                        <th>Familia del error</th>
                                        <th>Falla especifica</th>
                                        <th>Frecuencia</th>
                                        <th>Piezas afectadas</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {operador.erroresMasDetectados.map((errorItem, errorIndex) => (
                                        <tr key={`${rowKey}-${errorItem.familia || errorIndex}-${errorItem.detalle || errorIndex}`}>
                                          <td>{errorItem.familia || '-'}</td>
                                          <td style={{ whiteSpace: 'normal', minWidth: 220 }}>{errorItem.detalle || '-'}</td>
                                          <td><strong>{fmt(errorItem.veces)}</strong></td>
                                          <td><strong style={{ color: '#A80000' }}>{fmt(errorItem.piezasAfectadas)}</strong></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div style={{ border: '1px solid #EDEBE9', borderRadius: 4, padding: 10, background: '#fff' }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#252423', marginBottom: 8 }}>Predominio por piezas afectadas</div>
                                  <div style={{ display: 'grid', gap: 8 }}>
                                    {operador.erroresMasDetectados.slice(0, 5).map((errorItem, errorIndex) => (
                                      <div key={`${rowKey}-bar-${errorIndex}`}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 10, color: '#605E5C', marginBottom: 3 }}>
                                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{errorItem.detalle || errorItem.familia || '-'}</span>
                                          <strong>{fmt(errorItem.piezasAfectadas)}</strong>
                                        </div>
                                        <div className="prog-bar-bg">
                                          <div className="prog-bar-fill" style={{ width: `${Math.max((errorItem.piezasAfectadas / maxPiezas) * 100, 4)}%`, background: errorIndex === 0 ? '#A80000' : accent }} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div style={{ color: '#A19F9D', fontSize: 12, padding: 8 }}>Este operador no tiene desglose de errores para el periodo.</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No se registrÃ³ actividad de escaneo o incidencias para operadores en este rango de fechas." />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 10 }}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title="Evolución de estatus por semana"
            sub="Aprobadas · Con hallazgos · Desviadas · Rechazadas"
            action={<HelpIcon text="Muestra cómo cambia semana a semana el estatus de las tarimas. Sirve para ver si los hallazgos, desviaciones o rechazos están aumentando aunque el volumen total también cambie." open={openHelp === 'semanal'} onToggle={() => setOpenHelp(openHelp === 'semanal' ? '' : 'semanal')} />}
          />
          {semanas.length ? (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={semanas} margin={{ top: 6, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
                <XAxis dataKey="etiqueta" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<WeeklyTooltip />} />
                <Area type="monotone" dataKey="tarimasAprobadas" name="Aprobadas" stackId="estatus" stroke={STATUS_COLORS.aprobadas} fill={STATUS_COLORS.aprobadas} fillOpacity={0.75} />
                <Area type="monotone" dataKey="tarimasConHallazgos" name="Con hallazgos" stackId="estatus" stroke={STATUS_COLORS.hallazgos} fill={STATUS_COLORS.hallazgos} fillOpacity={0.75} />
                <Area type="monotone" dataKey="tarimasDesviadas" name="Desviadas" stackId="estatus" stroke={STATUS_COLORS.desviadas} fill={STATUS_COLORS.desviadas} fillOpacity={0.75} />
                <Area type="monotone" dataKey="tarimasRechazadas" name="Rechazadas" stackId="estatus" stroke={STATUS_COLORS.rechazadas} fill={STATUS_COLORS.rechazadas} fillOpacity={0.75} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title={`Actividad diaria — ${diaMesActivo?.nombreMes || ''} ${diaMesActivo?.anio || ''}`}
            sub="Intensidad por tarimas revisadas"
            action={<HelpIcon text="Cada celda representa un día del mes. El color se vuelve más intenso cuando hubo más tarimas revisadas, para detectar días pico, días sin actividad y concentración de hallazgos." open={openHelp === 'diaria'} onToggle={() => setOpenHelp(openHelp === 'diaria' ? '' : 'diaria')} />}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: -4, marginBottom: 8 }}>
            <button
              type="button"
              className="filter-btn"
              onClick={() => setMesActivoIndex((index) => Math.max(index - 1, 0))}
              disabled={mesActivoSeguro <= 0}
              style={{ padding: '3px 8px', minWidth: 26 }}
            >
              &lt;
            </button>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#605E5C', minWidth: 96, textAlign: 'center' }}>
              {diaMesActivo?.nombreMes ? `${diaMesActivo.nombreMes} ${diaMesActivo.anio}` : '-'}
            </span>
            <button
              type="button"
              className="filter-btn"
              onClick={() => setMesActivoIndex((index) => Math.min(index + 1, Math.max(diaMeses.length - 1, 0)))}
              disabled={mesActivoSeguro >= diaMeses.length - 1}
              style={{ padding: '3px 8px', minWidth: 26 }}
            >
              &gt;
            </button>
          </div>
          {calendarCells.length ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 5, marginBottom: 8 }}>
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
                  <div key={`${day}-${index}`} style={{ fontSize: 9, color: '#A19F9D', textAlign: 'center', fontWeight: 700 }}>{day}</div>
                ))}
                {calendarCells.map((day) => (
                  day.empty ? (
                    <div key={day.key} style={{ aspectRatio: '1', borderRadius: 4 }} />
                  ) : (
                    <div
                      key={day.key}
                      title={[
                        `Dia ${day.dia}`,
                        `Aprobadas: ${fmt(day.tarimasAprobadas)}`,
                        `Con hallazgos: ${fmt(day.tarimasConHallazgos)}`,
                        `Desviadas: ${fmt(day.tarimasDesviadas)}`,
                        `Rechazadas: ${fmt(day.tarimasRechazadas)}`,
                        `Cajas: ${fmt(day.cajasRevisadas)}`,
                      ].join('\n')}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 4,
                        background: heatColor(day.total),
                        color: textColor(day.total),
                        border: '1px solid rgba(0,0,0,.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                      }}
                    >
                      <strong style={{ fontSize: 12 }}>{day.dia}</strong>
                      <span style={{ fontSize: 9, opacity: 0.9 }}>{fmt(day.total)}</span>
                    </div>
                  )
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#605E5C', fontWeight: 600 }}>
                {fmt(diaMesActivo?.totalMes)} tarimas · {fmt(promedioActivo, 1)} promedio por día activo · día pico {diaMesActivo?.diaPico || '-'} con {fmt(diaMesActivo?.tarimasDiaPico)} tarimas
              </div>
            </>
          ) : <EmptyState />}
        </div>
      </div>
    </div>
  );
}
