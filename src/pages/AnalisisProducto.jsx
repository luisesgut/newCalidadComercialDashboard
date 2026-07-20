import { Fragment, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, ChevronDown, ChevronRight, Package, RefreshCw, Search } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ComposedChart, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getAnalisisProductoCritico } from '../services/verificacionApi';

const today = new Date().toISOString().slice(0, 10);
const defaultDesde = '2026-07-01';
const PROCESOS = ['BOLSEO', 'POUCH'];
const CLIENTES = ['Quality', 'Destiny', 'Pollos Guerrero', 'Mr Lucky', 'Mayalatex'];
const TIPOS_BOLSA = [
  { value: 'SELLO LATERAL', area: 'BOLSEO' },
  { value: 'SELLO LATERAL CON ZIPPER', area: 'BOLSEO' },
  { value: 'WICKET', area: 'BOLSEO' },
  { value: 'POUCH', area: 'POUCH' },
];
const EMPTY_OBJECT = {};
const EMPTY_ARRAY = [];

const fmt = (value, digits = 0) => Number(value || 0).toLocaleString('es-MX', {
  maximumFractionDigits: digits,
  minimumFractionDigits: digits,
});

function MetricCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card" style={{ padding: '12px 14px', borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div>
          <div className="kpi-label">{label}</div>
          <div className="kpi-value" style={{ marginTop: 4, color }}>{value}</div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: 4, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="card" style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, color: '#A19F9D', fontSize: 13, textAlign: 'center' }}>
      {text}
    </div>
  );
}

export default function AnalisisProducto({ accent }) {
  const [desde, setDesde] = useState(defaultDesde);
  const [hasta, setHasta] = useState(today);
  const [cliente, setCliente] = useState('todos');
  const [tipoProceso, setTipoProceso] = useState('todos');
  const [tipoBolsa, setTipoBolsa] = useState('todos');
  const [tipoMetrica, setTipoMetrica] = useState('AMBOS');
  const [data, setData] = useState(null);
  const [expandedProductKey, setExpandedProductKey] = useState(null);
  const [selectedPrintCard, setSelectedPrintCard] = useState(null);
  const [printCardSearch, setPrintCardSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const markFilterChange = () => {
    setLoading(true);
    setError('');
    setData(null);
    setExpandedProductKey(null);
    setSelectedPrintCard(null);
    setPrintCardSearch('');
  };

  const load = async () => {
    setLoading(true);
    setError('');
    setData(null);
    setExpandedProductKey(null);
    setSelectedPrintCard(null);
    try {
      setData(await getAnalisisProductoCritico({ desde, hasta, cliente, tipoProceso, tipoBolsa, tipoMetrica }));
    } catch (loadError) {
      setData(null);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    getAnalisisProductoCritico({ desde, hasta, cliente, tipoProceso, tipoBolsa, tipoMetrica })
      .then((payload) => { if (!ignore) setData(payload); })
      .catch((loadError) => {
        if (!ignore) {
          setData(null);
          setError(loadError.message);
        }
      })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [desde, hasta, cliente, tipoProceso, tipoBolsa, tipoMetrica]);

  const resumen = data || EMPTY_OBJECT;
  const productosAfectados = useMemo(() => (
    (Array.isArray(resumen.productosAfectados) ? resumen.productosAfectados : EMPTY_ARRAY)
      .map((item) => ({
        ...item,
        tarimasRechazadas: Number(item.tarimasRechazadas || 0),
        tarimasDesviadas: Number(item.tarimasDesviadas || 0),
        tarimasCriticasTotales: Number(item.tarimasCriticasTotales || 0),
        cajasAfectadas: Number(item.cajasAfectadas || 0),
        totalPiezasMermadas: Number(item.totalPiezasMermadas || 0),
      }))
      .sort((a, b) => tipoMetrica === 'CAJAS'
        ? b.cajasAfectadas - a.cajasAfectadas
        : b.tarimasCriticasTotales - a.tarimasCriticasTotales)
  ), [resumen, tipoMetrica]);
  const tiposBolsaDisponibles = tipoProceso === 'todos'
    ? EMPTY_ARRAY
    : TIPOS_BOLSA.filter((item) => item.area === tipoProceso);
  const productosGrafico = productosAfectados.slice(0, 10).map((item) => ({
    ...item,
    etiquetaGrafico: item.printCard || item.claveProducto || 'Sin PrintCard',
  }));
  const productosTabla = selectedPrintCard
    ? productosAfectados.filter((item) => item.printCard === selectedPrintCard)
    : productosAfectados.filter((item) => (
      !printCardSearch.trim()
      || String(item.printCard || '').toLowerCase().includes(printCardSearch.trim().toLowerCase())
    ));

  return (
    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#252423' }}>
          <CalendarDays size={15} color={accent} /> Filtros de producto
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Proceso
          <select className="pbi-select" value={tipoProceso} onChange={(event) => { markFilterChange(); setTipoProceso(event.target.value); setTipoBolsa('todos'); }} style={{ minWidth: 130 }}>
            <option value="todos">Todos</option>
            {PROCESOS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        {tiposBolsaDisponibles.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
            Tipo de bolsa
            <select className="pbi-select" value={tipoBolsa} onChange={(event) => { markFilterChange(); setTipoBolsa(event.target.value); }} style={{ minWidth: 180 }}>
              <option value="todos">Todas</option>
              {tiposBolsaDisponibles.map((item) => <option key={item.value} value={item.value}>{item.value}</option>)}
            </select>
          </label>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Cliente
          <select className="pbi-select" value={cliente} onChange={(event) => { markFilterChange(); setCliente(event.target.value); }} style={{ minWidth: 150 }}>
            <option value="todos">Todos</option>
            {CLIENTES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Desde
          <input className="pbi-input" type="date" value={desde} onChange={(event) => { markFilterChange(); setDesde(event.target.value); }} style={{ width: 140 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Hasta
          <input className="pbi-input" type="date" value={hasta} onChange={(event) => { markFilterChange(); setHasta(event.target.value); }} style={{ width: 140 }} />
        </label>
        <button className="filter-btn" onClick={load} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} /> {loading ? 'Cargando' : 'Actualizar'}
        </button>
      </div>

      <div className="card" style={{ padding: 6, display: 'inline-flex', alignSelf: 'flex-start', gap: 4 }}>
        {[
          ['AMBOS', 'Ver ambos'],
          ['TARIMAS', 'Enfoque tarimas'],
          ['CAJAS', 'Enfoque cajas'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => { markFilterChange(); setTipoMetrica(value); }}
            style={{ border: 'none', borderRadius: 6, padding: '7px 11px', background: tipoMetrica === value ? accent : 'transparent', color: tipoMetrica === value ? '#fff' : '#605E5C', cursor: 'pointer', fontSize: 11, fontWeight: 750 }}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#FDE7E9', color: '#A80000', borderRadius: 4, padding: 8, fontSize: 11 }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: '12px 14px', background: '#EFF6FF', borderLeft: `4px solid ${accent}` }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8', marginBottom: 4 }}>
          Lectura de producto critico
        </div>
        <div style={{ fontSize: 12, color: '#1E3A8A', lineHeight: 1.55 }}>
          Aquí se visualizan los productos con más incidencias de calidad, medidos por cajas afectadas y tarimas críticas rechazadas o desviadas.
        </div>
      </div>

      {loading ? (
        <EmptyState text="Cargando analisis de producto..." />
      ) : !productosAfectados.length ? (
        <EmptyState text="Sin incidencias de calidad registradas para el proceso y rango de fechas seleccionado." />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            <MetricCard label="Total de productos con fallos" value={fmt(resumen.totalProductosConFallos)} icon={Package} color={accent} />
            <MetricCard label="Total general de tarimas críticas" value={fmt(resumen.totalGeneralTarimasCriticas)} icon={AlertTriangle} color="#B01A30" />
            <MetricCard label="Total general de cajas afectadas" value={fmt(resumen.totalGeneralCajasAfectadas)} icon={Package} color="#D06430" />
          </div>

          <div className="card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#153E3E' }}>Top PrintCards más críticos</div>
                <div style={{ fontSize: 10, color: '#657879', marginTop: 2 }}>
                  {tipoMetrica === 'CAJAS' ? 'Cajas afectadas' : tipoMetrica === 'TARIMAS' ? 'Tarimas rechazadas y desviadas' : 'Tarimas críticas y relación con cajas afectadas'} · haz clic en una barra para filtrar el detalle
                </div>
              </div>
              {selectedPrintCard && (
                <button type="button" onClick={() => setSelectedPrintCard(null)} style={{ border: 'none', background: 'transparent', color: accent, cursor: 'pointer', fontSize: 10, fontWeight: 800 }}>
                  Mostrar todos
                </button>
              )}
            </div>
            <ResponsiveContainer width="100%" height={Math.max(280, productosGrafico.length * 38)}>
              {tipoMetrica === 'CAJAS' ? (
                <BarChart data={productosGrafico} layout="vertical" margin={{ top: 4, right: 48, left: 115, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: '#657879', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="etiquetaGrafico" width={110} tick={{ fill: '#153E3E', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [`${fmt(value)} cajas`, 'Cajas afectadas']} />
                  <Bar dataKey="cajasAfectadas" name="Cajas afectadas" fill="#85B6C4" radius={[0, 4, 4, 0]} barSize={18} style={{ cursor: 'pointer' }} onClick={(item) => setSelectedPrintCard(item?.payload?.printCard || item?.printCard || null)}>
                    <LabelList dataKey="cajasAfectadas" position="right" formatter={(value) => fmt(value)} style={{ fill: '#153E3E', fontSize: 10, fontWeight: 800 }} />
                  </Bar>
                </BarChart>
              ) : tipoMetrica === 'TARIMAS' ? (
                <BarChart data={productosGrafico} layout="vertical" margin={{ top: 4, right: 48, left: 115, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: '#657879', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="etiquetaGrafico" width={110} tick={{ fill: '#153E3E', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value, name) => [`${fmt(value)} tarimas`, name]} />
                  <Bar dataKey="tarimasRechazadas" name="Rechazadas" stackId="criticas" fill="#B01A30" barSize={18} style={{ cursor: 'pointer' }} onClick={(item) => setSelectedPrintCard(item?.payload?.printCard || item?.printCard || null)} />
                  <Bar dataKey="tarimasDesviadas" name="Desviadas" stackId="criticas" fill="#D06430" radius={[0, 4, 4, 0]} barSize={18} style={{ cursor: 'pointer' }} onClick={(item) => setSelectedPrintCard(item?.payload?.printCard || item?.printCard || null)}>
                    <LabelList dataKey="tarimasCriticasTotales" position="right" formatter={(value) => fmt(value)} style={{ fill: '#153E3E', fontSize: 10, fontWeight: 800 }} />
                  </Bar>
                </BarChart>
              ) : (
                <ComposedChart data={productosGrafico} layout="vertical" margin={{ top: 18, right: 48, left: 115, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEE" horizontal={false} />
                  <XAxis xAxisId="tarimas" type="number" allowDecimals={false} tick={{ fill: '#657879', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <XAxis xAxisId="cajas" type="number" orientation="top" allowDecimals={false} tick={{ fill: '#85B6C4', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="etiquetaGrafico" width={110} tick={{ fill: '#153E3E', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar xAxisId="tarimas" dataKey="tarimasRechazadas" name="Tarimas rechazadas" stackId="criticas" fill="#B01A30" barSize={18} style={{ cursor: 'pointer' }} onClick={(item) => setSelectedPrintCard(item?.payload?.printCard || item?.printCard || null)} />
                  <Bar xAxisId="tarimas" dataKey="tarimasDesviadas" name="Tarimas desviadas" stackId="criticas" fill="#D06430" radius={[0, 4, 4, 0]} barSize={18} style={{ cursor: 'pointer' }} onClick={(item) => setSelectedPrintCard(item?.payload?.printCard || item?.printCard || null)} />
                  <Line xAxisId="cajas" dataKey="cajasAfectadas" name="Cajas afectadas" stroke="#153E3E" strokeWidth={2.5} dot={{ fill: '#85B6C4', stroke: '#153E3E', strokeWidth: 1.5, r: 4 }} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#252423' }}>Productos afectados del periodo</div>
                <div style={{ fontSize: 10, color: '#A19F9D', marginTop: 2 }}>Expande un producto para ver sus incidencias especificas</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={13} color="#657879" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    className="pbi-input"
                    type="search"
                    value={printCardSearch}
                    onChange={(event) => {
                      setPrintCardSearch(event.target.value);
                      setSelectedPrintCard(null);
                      setExpandedProductKey(null);
                    }}
                    placeholder="Buscar PrintCard..."
                    aria-label="Buscar por PrintCard"
                    style={{ width: 220, paddingLeft: 29 }}
                  />
                </div>
                <div style={{ fontSize: 10, color: '#605E5C', fontWeight: 700 }}>{fmt(productosTabla.length)} productos</div>
              </div>
            </div>

            <div style={{ overflow: 'auto', maxHeight: 520 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 42 }} />
                    <th>PrintCard / Clave</th>
                    <th>Nombre del producto</th>
                    <th>Cliente</th>
                    {(tipoMetrica === 'CAJAS' || tipoMetrica === 'AMBOS') && <th>Cajas afectadas</th>}
                    {(tipoMetrica === 'TARIMAS' || tipoMetrica === 'AMBOS') && <th>Tarimas rechazadas</th>}
                    {(tipoMetrica === 'TARIMAS' || tipoMetrica === 'AMBOS') && <th>Tarimas desviadas</th>}
                  </tr>
                </thead>
                <tbody>
                  {productosTabla.map((producto, index) => {
                    const rowKey = `${producto.claveProducto || 'producto'}-${producto.printCard || index}`;
                    const isExpanded = expandedProductKey === rowKey;
                    const incidenciasProducto = (Array.isArray(producto.desgloseIncidencias) ? producto.desgloseIncidencias : EMPTY_ARRAY)
                      .map((item) => ({
                        ...item,
                        veces: Number(item.veces || 0),
                        piezasAfectadas: Number(item.piezasAfectadas || 0),
                      }))
                      .sort((a, b) => b.veces - a.veces);

                    return (
                      <Fragment key={rowKey}>
                        <tr onClick={() => setExpandedProductKey(isExpanded ? null : rowKey)}>
                          <td>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setExpandedProductKey(isExpanded ? null : rowKey);
                              }}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 4,
                                border: '1px solid #EDEBE9',
                                background: isExpanded ? `${accent}18` : '#fff',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: accent,
                              }}
                              aria-label={isExpanded ? 'Contraer producto' : 'Expandir producto'}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          </td>
                          <td>
                            <strong>{producto.printCard || '-'}</strong>
                            <div style={{ color: '#657879', fontSize: 10, marginTop: 2 }}>{producto.claveProducto || '-'}</div>
                          </td>
                          <td style={{ whiteSpace: 'normal', minWidth: 260 }}>{producto.nombreProductoPt || '-'}</td>
                          <td>{producto.cliente || '-'}</td>
                          {(tipoMetrica === 'CAJAS' || tipoMetrica === 'AMBOS') && <td><strong style={{ color: '#D06430' }}>{fmt(producto.cajasAfectadas)}</strong></td>}
                          {(tipoMetrica === 'TARIMAS' || tipoMetrica === 'AMBOS') && <td><strong style={{ color: '#B01A30' }}>{fmt(producto.tarimasRechazadas)}</strong></td>}
                          {(tipoMetrica === 'TARIMAS' || tipoMetrica === 'AMBOS') && <td><strong style={{ color: '#D06430' }}>{fmt(producto.tarimasDesviadas)}</strong></td>}
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={4 + (tipoMetrica === 'AMBOS' ? 3 : tipoMetrica === 'TARIMAS' ? 2 : 1)} style={{ background: '#FAFAFA', padding: 10 }}>
                              {incidenciasProducto.length ? (
                                <div style={{ border: '1px solid #EDEBE9', borderRadius: 4, overflow: 'hidden' }}>
                                  <table className="tbl">
                                    <thead>
                                      <tr>
                                        <th>Familia de defecto</th>
                                        <th>Detalle del error</th>
                                        <th>Eventos reportados</th>
                                        <th>Impacto en piezas</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {incidenciasProducto.map((incidencia, incidenciaIndex) => (
                                        <tr key={`${rowKey}-${incidencia.familia || 'familia'}-${incidencia.detalle || incidenciaIndex}`}>
                                          <td>{incidencia.familia || '-'}</td>
                                          <td style={{ whiteSpace: 'normal', minWidth: 260 }}>{incidencia.detalle || '-'}</td>
                                          <td><strong>{fmt(incidencia.veces)}</strong></td>
                                          <td><strong style={{ color: '#B01A30' }}>{fmt(incidencia.piezasAfectadas)}</strong></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div style={{ color: '#A19F9D', fontSize: 12, padding: 8 }}>Este producto no tiene desglose de incidencias.</div>
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
          </div>
        </>
      )}
    </div>
  );
}
