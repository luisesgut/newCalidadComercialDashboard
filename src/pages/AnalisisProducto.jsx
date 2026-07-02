import { Fragment, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, ChevronDown, ChevronRight, Package, RefreshCw } from 'lucide-react';
import { getAnalisisProductoCritico } from '../services/verificacionApi';

const today = new Date().toISOString().slice(0, 10);
const defaultDesde = '2026-06-01';
const PROCESOS = ['BOLSEO', 'POUCH'];
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
  const [tipoProceso, setTipoProceso] = useState('todos');
  const [data, setData] = useState(null);
  const [expandedProductKey, setExpandedProductKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const markFilterChange = () => {
    setLoading(true);
    setError('');
    setData(null);
    setExpandedProductKey(null);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    setData(null);
    setExpandedProductKey(null);
    try {
      setData(await getAnalisisProductoCritico({ desde, hasta, tipoProceso }));
    } catch (loadError) {
      setData(null);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    getAnalisisProductoCritico({ desde, hasta, tipoProceso })
      .then((payload) => { if (!ignore) setData(payload); })
      .catch((loadError) => {
        if (!ignore) {
          setData(null);
          setError(loadError.message);
        }
      })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [desde, hasta, tipoProceso]);

  const resumen = data || EMPTY_OBJECT;
  const productosAfectados = useMemo(() => (
    (Array.isArray(resumen.productosAfectados) ? resumen.productosAfectados : EMPTY_ARRAY)
      .map((item) => ({
        ...item,
        totalTarimasAfectadas: Number(item.totalTarimasAfectadas || 0),
        totalPiezasAfectadas: Number(item.totalPiezasAfectadas || 0),
      }))
      .sort((a, b) => b.totalPiezasAfectadas - a.totalPiezasAfectadas)
  ), [resumen]);

  return (
    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#252423' }}>
          <CalendarDays size={15} color={accent} /> Filtros de producto
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Proceso
          <select className="pbi-select" value={tipoProceso} onChange={(event) => { markFilterChange(); setTipoProceso(event.target.value); }} style={{ minWidth: 130 }}>
            <option value="todos">Todos</option>
            {PROCESOS.map((item) => <option key={item} value={item}>{item}</option>)}
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
Aqui se visualizan los productos con mas incidencias de calidad, calculadas a nivel de caja individual y piezas afectadas. Puedes filtrar por tipo de producto <strong>BOLSEO</strong> o <strong>POUCH</strong> para enfocar el analisis.        </div>
      </div>

      {loading ? (
        <EmptyState text="Cargando analisis de producto..." />
      ) : !productosAfectados.length ? (
        <EmptyState text="Sin incidencias de calidad registradas para el proceso y rango de fechas seleccionado." />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <MetricCard label="Total de productos con fallos" value={fmt(resumen.totalProductosAfectadosEnPeriodo)} icon={Package} color={accent} />
            <MetricCard label="TOTAL GENERAL DE PIEZAS CON ALGUN DEFECTO ENCONTRADO" value={fmt(resumen.totalPiezasDefectuosasPeriodo)} icon={AlertTriangle} color="#A80000" />
          </div>

          <div className="card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#252423' }}>Productos afectados del periodo</div>
                <div style={{ fontSize: 10, color: '#A19F9D', marginTop: 2 }}>Expande un producto para ver sus incidencias especificas</div>
              </div>
              <div style={{ fontSize: 10, color: '#605E5C', fontWeight: 700 }}>{fmt(productosAfectados.length)} productos</div>
            </div>

            <div style={{ overflow: 'auto', maxHeight: 520 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 42 }} />
                    <th>Clave PT</th>
                    <th>Nombre del producto</th>
                    <th>PrintCard</th>
                    <th>Cliente</th>
                    <th>Tarimas afectadas</th>
                    <th>Piezas totales danadas</th>
                  </tr>
                </thead>
                <tbody>
                  {productosAfectados.map((producto, index) => {
                    const rowKey = `${producto.claveProducto || 'producto'}-${producto.printCard || index}`;
                    const isExpanded = expandedProductKey === rowKey;
                    const incidenciasProducto = (Array.isArray(producto.desgloseIncidencias) ? producto.desgloseIncidencias : EMPTY_ARRAY)
                      .map((item) => ({
                        ...item,
                        veces: Number(item.veces || 0),
                        piezasAfectadas: Number(item.piezasAfectadas || 0),
                      }))
                      .sort((a, b) => b.piezasAfectadas - a.piezasAfectadas);

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
                          <td>{producto.claveProducto || '-'}</td>
                          <td style={{ whiteSpace: 'normal', minWidth: 260 }}>{producto.nombreProductoPt || '-'}</td>
                          <td>{producto.printCard || '-'}</td>
                          <td>{producto.cliente || '-'}</td>
                          <td><strong>{fmt(producto.totalTarimasAfectadas)}</strong></td>
                          <td><strong style={{ color: '#A80000' }}>{fmt(producto.totalPiezasAfectadas)}</strong></td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} style={{ background: '#FAFAFA', padding: 10 }}>
                              {incidenciasProducto.length ? (
                                <div style={{ border: '1px solid #EDEBE9', borderRadius: 4, overflow: 'hidden' }}>
                                  <table className="tbl">
                                    <thead>
                                      <tr>
                                        <th>Familia de defecto</th>
                                        <th>Detalle del error</th>
                                        <th>Eventos reportados</th>
                                        <th>Piezas afectadas</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {incidenciasProducto.map((incidencia, incidenciaIndex) => (
                                        <tr key={`${rowKey}-${incidencia.familia || 'familia'}-${incidencia.detalle || incidenciaIndex}`}>
                                          <td>{incidencia.familia || '-'}</td>
                                          <td style={{ whiteSpace: 'normal', minWidth: 260 }}>{incidencia.detalle || '-'}</td>
                                          <td><strong>{fmt(incidencia.veces)}</strong></td>
                                          <td><strong style={{ color: '#A80000' }}>{fmt(incidencia.piezasAfectadas)}</strong></td>
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
