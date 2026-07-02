import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CalendarDays, ChevronDown, ChevronRight, RefreshCw, X } from 'lucide-react';
import CustomTooltip from '../components/CustomTooltip';
import { DashboardFilterProvider, useDashboardFilter } from '../context/DashboardFilterContext';
import { useDashboardInteractivo } from '../hooks/useDashboardInteractivo';
import { getDashboardAnalytics, getDetalleInteractivo, getIncidenciasPorOperador } from '../services/verificacionApi';

const today = new Date().toISOString().slice(0, 10);
const defaultDesde = '2026-04-01';
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
const CLIENTES = ['Quality', 'Destiny', 'Pollos Guerrero', 'Mr Lucky', 'Mayalatex'];
const AREAS = ['POUCH', 'BOLSEO'];

const fmt = (value, digits = 0) => Number(value || 0).toLocaleString('es-MX', {
  maximumFractionDigits: digits,
  minimumFractionDigits: digits,
});

const pct = (value) => `${fmt(value, 1)}%`;
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '';
const labelIfValue = (value) => Number(value || 0) > 0 ? fmt(value) : '';

function eficienciaColor(value) {
  const tasa = Number(value || 0);
  if (tasa >= 90) return { bg: '#DFF6DD', color: '#107C10' };
  if (tasa >= 80) return { bg: '#FFF4CE', color: '#7A4F01' };
  return { bg: '#FDE7E9', color: '#A80000' };
}

function CardTitle({ title, sub }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#252423', marginBottom: 2 }}>{title}</div>
        {sub && <div style={{ fontSize: 10, color: '#A19F9D' }}>{sub}</div>}
      </div>
    </div>
  );
}

function EmptyState({ text = 'Sin datos para el rango seleccionado' }) {
  return (
    <div style={{ height: '100%', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A19F9D', fontSize: 12 }}>
      {text}
    </div>
  );
}

function EficienciaOperadorInner({ accent, initialDesde = defaultDesde, initialHasta = today }) {
  const [desde, setDesde] = useState(initialDesde);
  const [hasta, setHasta] = useState(initialHasta);
  const [cliente, setCliente] = useState('todos');
  const [tipoProceso, setTipoProceso] = useState('todos');
  const [data, setData] = useState(null);
  const [operadores, setOperadores] = useState(null);
  const [expandedOperador, setExpandedOperador] = useState(null);
  const [tarimasDetalle, setTarimasDetalle] = useState(EMPTY_ARRAY);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState(EMPTY_ARRAY);
  const { filtros, toggleFiltro, limpiarFiltros, hayFiltros } = useDashboardFilter();
  const interactivo = useDashboardInteractivo(tarimasDetalle, filtros);

  const load = async () => {
    setLoading(true);
    try {
      const [payload, operadoresPayload] = await Promise.all([
        getDashboardAnalytics({ desde, hasta, cliente, tipoProceso }),
        getIncidenciasPorOperador({ desde, hasta }),
      ]);
      setData(payload);
      setOperadores(operadoresPayload);
      setExpandedOperador(null);
      setErrors(payload.errors || EMPTY_ARRAY);
    } catch (error) {
      setErrors([error.message]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getDashboardAnalytics({ desde, hasta, cliente, tipoProceso }),
      getIncidenciasPorOperador({ desde, hasta }),
    ])
      .then(([payload, operadoresPayload]) => {
        if (!ignore) {
          setData(payload);
          setOperadores(operadoresPayload);
          setExpandedOperador(null);
          setErrors(payload.errors || EMPTY_ARRAY);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setErrors([error.message]);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => { ignore = true; };
  }, [desde, hasta, cliente, tipoProceso]);

  useEffect(() => {
    let ignore = false;
    getDetalleInteractivo({ desde, hasta, cliente, tipoProceso })
      .then((payload) => {
        if (!ignore) {
          setTarimasDetalle(payload?.tarimas || EMPTY_ARRAY);
        }
      })
      .catch(() => {
        if (!ignore) {
          setTarimasDetalle(EMPTY_ARRAY);
        }
      });
    return () => { ignore = true; };
  }, [desde, hasta, cliente, tipoProceso]);

  const eficiencia = data?.eficienciaOperadora?.operadoras || EMPTY_ARRAY;
  const turno = data?.tarimasPorTurno || EMPTY_OBJECT;
  const usaFiltroInteractivo = hayFiltros && interactivo.datos.length > 0;

  const datosEficiencia = useMemo(() => (
    interactivo.porOperador.length
      ? interactivo.porOperador
      : eficiencia.map((item) => ({ operador: item.usuario, total: item.totalCajas }))
  ), [eficiencia, interactivo.porOperador]);

  const reporteOperadores = useMemo(() => (
    (Array.isArray(operadores?.reporteOperadores) ? operadores.reporteOperadores : EMPTY_ARRAY)
      .map((operador) => ({
        ...operador,
        totalCajasRevisadas: Number(operador.totalCajasRevisadas || 0),
        totalCajasConDefecto: Number(operador.totalCajasConDefecto || 0),
        totalPiezasMermadas: Number(operador.totalPiezasMermadas || 0),
        tasaEficienciaEfectiva: Number(operador.tasaEficienciaEfectiva || 0),
        tarimasAprobadas: Number(operador.tarimasAprobadas || 0),
        tarimasRechazadas: Number(operador.tarimasRechazadas || 0),
        tarimasDesviadas: Number(operador.tarimasDesviadas || 0),
        erroresMasDetectados: (Array.isArray(operador.erroresMasDetectados) ? operador.erroresMasDetectados : EMPTY_ARRAY)
          .map((errorItem) => ({
            ...errorItem,
            veces: Number(errorItem.veces || 0),
            piezasAfectadas: Number(errorItem.piezasAfectadas || 0),
          }))
          .sort((a, b) => b.piezasAfectadas - a.piezasAfectadas),
      }))
      .sort((a, b) => (
        (b.totalPiezasMermadas + b.tarimasAprobadas + b.tarimasRechazadas + b.tarimasDesviadas)
        - (a.totalPiezasMermadas + a.tarimasAprobadas + a.tarimasRechazadas + a.tarimasDesviadas)
      ))
  ), [operadores]);

  const tarimasDiaVista = useMemo(() => {
    if (usaFiltroInteractivo && interactivo.porDiaTurno.length) {
      return interactivo.porDiaTurno.map((item) => ({ ...item, dia: dateLabel(item.fecha) }));
    }

    return (turno.porDia || []).map((item) => ({
      ...item,
      dia: dateLabel(item.fecha),
    }));
  }, [interactivo.porDiaTurno, turno.porDia, usaFiltroInteractivo]);

  const resumenTurnoVista = usaFiltroInteractivo
    ? interactivo.resumenTurno
    : [turno.resumenMatutino, turno.resumenVespertino].filter(Boolean);
  const usaVistaTurnoPorOperador = usaFiltroInteractivo && Boolean(filtros.operador);

  const barColor = (valor, seleccionado) =>
    !seleccionado || seleccionado === valor ? undefined : '#B4B2A9';

  return (
    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#252423' }}>
          <CalendarDays size={15} color={accent} /> Rango analitico
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Desde
          <input className="pbi-input" type="date" value={desde} onChange={(event) => { setLoading(true); setDesde(event.target.value); }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Hasta
          <input className="pbi-input" type="date" value={hasta} onChange={(event) => { setLoading(true); setHasta(event.target.value); }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Cliente
          <select className="pbi-select" value={cliente} onChange={(event) => { setLoading(true); setCliente(event.target.value); }} style={{ minWidth: 130 }}>
            <option value="todos">Todos</option>
            {CLIENTES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Area
          <select className="pbi-select" value={tipoProceso} onChange={(event) => { setLoading(true); setTipoProceso(event.target.value); }} style={{ minWidth: 120 }}>
            <option value="todos">Todas</option>
            {AREAS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <button className="filter-btn" onClick={load} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} /> {loading ? 'Cargando' : 'Actualizar'}
        </button>
        <div style={{ marginLeft: 'auto', fontSize: 10, color: errors.length ? '#A80000' : '#107C10', fontWeight: 600 }}>
          {errors.length ? `${errors.length} endpoint(s) sin respuesta` : 'API en vivo'}
        </div>
      </div>

      {hayFiltros && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '8px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4 }}>
          <span style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 600 }}>Filtrando por:</span>
          {filtros.operador && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#DBEAFE', color: '#1D4ED8', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>
              {filtros.operador}
              <X size={11} style={{ cursor: 'pointer' }} onClick={() => toggleFiltro('operador', filtros.operador)} />
            </span>
          )}
          {filtros.turno && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#DBEAFE', color: '#1D4ED8', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>
              {filtros.turno}
              <X size={11} style={{ cursor: 'pointer' }} onClick={() => toggleFiltro('turno', filtros.turno)} />
            </span>
          )}
          <button onClick={limpiarFiltros} style={{ marginLeft: 'auto', fontSize: 11, background: 'none', border: 'none', color: '#1D4ED8', cursor: 'pointer', textDecoration: 'underline' }}>
            Limpiar todo
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 10 }}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle title="Eficiencia operador" sub="Tarimas creadas" />
          {datosEficiencia.length ? (
            <ResponsiveContainer width="100%" height={Math.max(260, datosEficiencia.length * 36)}>
              <BarChart data={datosEficiencia} layout="vertical" margin={{ top: 4, right: 42, left: 136, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="operador" width={132} tick={{ fill: '#605E5C', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Tarimas" radius={[0, 3, 3, 0]} barSize={22}
                     onClick={(row) => toggleFiltro('operador', row.operador)}
                     cursor="pointer">
                  {datosEficiencia.map((item) => (
                    <Cell key={item.operador} fill={barColor(item.operador, filtros.operador) ?? '#0078D4'} />
                  ))}
                  <LabelList dataKey="total" position="right" formatter={labelIfValue} style={{ fill: '#252423', fontSize: 11, fontWeight: 800 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle title="Tarimas por turno" sub="Matutino vs vespertino por dia" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: -4, marginBottom: 6, fontSize: 10, color: '#605E5C', fontWeight: 700 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: '#16A34A' }} />
              Matutino
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: '#2563EB' }} />
              Vespertino
            </span>
          </div>
          {usaVistaTurnoPorOperador ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={resumenTurnoVista} margin={{ top: 18, right: 8, left: -10, bottom: 0 }}
                        onClick={(chartData) => { if (chartData?.activePayload) toggleFiltro('turno', chartData.activePayload[0]?.payload?.turno); }}
                        style={{ cursor: 'pointer' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
                <XAxis dataKey="turno" tick={{ fill: '#605E5C', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalTarimas" name="Tarimas" radius={[3, 3, 0, 0]} barSize={42}>
                  {resumenTurnoVista.map((item) => (
                    <Cell
                      key={item.turno}
                      fill={item.turno === 'Matutino' ? '#16A34A' : '#2563EB'}
                      opacity={!filtros.turno || filtros.turno === item.turno ? 1 : 0.3}
                    />
                  ))}
                  <LabelList dataKey="totalTarimas" position="top" formatter={labelIfValue} style={{ fill: '#252423', fontSize: 11, fontWeight: 800 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : tarimasDiaVista.length ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={tarimasDiaVista} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
                        onClick={(chartData) => { if (chartData?.activePayload) toggleFiltro('turno', chartData.activePayload[0]?.name === 'Matutino' ? 'Matutino' : 'Vespertino'); }}
                        style={{ cursor: 'pointer' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
                <XAxis dataKey="dia" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="matutino" name="Matutino" stackId="turno" fill="#16A34A" radius={[0, 0, 0, 0]}
                     opacity={!filtros.turno || filtros.turno === 'Matutino' ? 1 : 0.3}>
                  <LabelList dataKey="matutino" position="center" formatter={labelIfValue} style={{ fill: '#fff', fontSize: 10, fontWeight: 800 }} />
                </Bar>
                <Bar dataKey="vespertino" name="Vespertino" stackId="turno" fill="#2563EB" radius={[3, 3, 0, 0]}
                     opacity={!filtros.turno || filtros.turno === 'Vespertino' ? 1 : 0.3}>
                  <LabelList dataKey="vespertino" position="center" formatter={labelIfValue} style={{ fill: '#fff', fontSize: 10, fontWeight: 800 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {resumenTurnoVista.map((item) => {
              const seleccionado = filtros.turno === item.turno;
              return (
                <div
                  key={item.turno}
                  onClick={() => toggleFiltro('turno', item.turno)}
                  style={{
                    flex: 1,
                    background: seleccionado ? '#DBEAFE' : '#F3F2F1',
                    border: seleccionado ? '1px solid #93C5FD' : '1px solid transparent',
                    borderRadius: 4,
                    padding: 8,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 10, color: seleccionado ? '#1D4ED8' : '#605E5C', fontWeight: seleccionado ? 700 : 400 }}>{item.turno}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: seleccionado ? '#1D4ED8' : '#252423' }}>
                    {fmt(item.totalTarimas)} <span style={{ fontSize: 11, color: '#A19F9D', fontWeight: 400 }}>{pct(item.porcentaje)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 14px' }}>
        <CardTitle
          title="Eficiencia operador"
          sub="Cajas auditadas, piezas mermadas y errores mas detectados por persona"
        />

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 10, alignItems: 'stretch', marginBottom: 10 }}>
          <div style={{ border: '1px solid #EDEBE9', borderRadius: 4, padding: '12px 14px', borderTop: `3px solid ${accent}`, background: '#fff' }}>
            <div className="kpi-label">Personal activo en el periodo</div>
            <div className="kpi-value" style={{ marginTop: 6 }}>{fmt(operadores?.totalOperadoresAuditados ?? reporteOperadores.length)}</div>
            <div className="kpi-sub">Operadoras y operarios con actividad</div>
          </div>
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderLeft: `4px solid ${accent}`, borderRadius: 4, padding: '10px 12px', fontSize: 12, color: '#1E3A8A', lineHeight: 1.5 }}>
            Evalua el desempeno por persona en el rango seleccionado, incluyendo cajas escaneadas y decisiones de tarimas aprobadas, rechazadas o desviadas. Expande un operador para ver que familias y fallas especificas concentran mas piezas afectadas.
          </div>
        </div>

        {loading ? (
          <EmptyState text="Cargando eficiencia de operadores..." />
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
                  <th>Tarimas aprobadas</th>
                  <th>Tarimas rechazadas</th>
                  <th>Tarimas desviadas</th>
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
                      <tr onClick={() => setExpandedOperador(expanded ? null : rowKey)}>
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
                            aria-label={expanded ? 'Contraer operador' : 'Expandir operador'}
                          >
                            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </td>
                        <td style={{ fontWeight: 700 }}>{operador.usuarioOperador || '-'}</td>
                        <td>{fmt(operador.totalCajasRevisadas)}</td>
                        <td>{fmt(operador.totalCajasConDefecto)}</td>
                        <td><strong style={{ color: '#A80000' }}>{fmt(operador.totalPiezasMermadas)}</strong></td>
                        <td><strong style={{ color: '#107C10' }}>{fmt(operador.tarimasAprobadas)}</strong></td>
                        <td><strong style={{ color: '#A80000' }}>{fmt(operador.tarimasRechazadas)}</strong></td>
                        <td><strong style={{ color: '#7A4F01' }}>{fmt(operador.tarimasDesviadas)}</strong></td>
                        <td>
                          <span className="badge" style={{ background: badge.bg, color: badge.color }}>
                            {pct(operador.tasaEficienciaEfectiva)}
                          </span>
                        </td>
                      </tr>
                      {expanded && (
                        <tr>
                          <td colSpan={9} style={{ background: '#FAFAFA', padding: 10 }}>
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
          <EmptyState text="No se registro actividad de escaneo o incidencias para operadores en este rango de fechas." />
        )}
      </div>
    </div>
  );
}

export default function EficienciaOperador(props) {
  return (
    <DashboardFilterProvider>
      <EficienciaOperadorInner {...props} />
    </DashboardFilterProvider>
  );
}
