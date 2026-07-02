import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Boxes, CheckSquare, ChevronDown, ChevronRight, Layers, PackageX, RefreshCw, Search,
} from 'lucide-react';
import KPICard from '../components/KPICard';
import { getDefectosFamilias, postAuditoriaDefectos } from '../services/verificacionApi';

const today = new Date().toISOString().slice(0, 10);
const defaultDesde = '2026-06-01';
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
const CLIENTES = ['QUALITY', 'DESTINY', 'POLLOS GUERRERO', 'MR LUCKY', 'MAYALATEX'];
const FAMILIAS_PRODUCTO = ['POUCH', 'BOLSEO'];

const fmt = (value, digits = 0) => Number(value || 0).toLocaleString('es-MX', {
  maximumFractionDigits: digits,
  minimumFractionDigits: digits,
});

const fmtDate = (value) => (
  value ? new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'
);

function valueOf(source, keys, fallback = '') {
  const key = keys.find((item) => source?.[item] !== undefined && source?.[item] !== null && source?.[item] !== '');
  return key ? source[key] : fallback;
}

function EmptyState({ text = 'Sin datos para los filtros seleccionados' }) {
  return (
    <div style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A19F9D', fontSize: 12 }}>
      {text}
    </div>
  );
}

function BadgeEstatus({ value }) {
  const text = value || '-';
  const cls = text === 'Rechazada' ? 'badge-critical' : 'badge-major';
  return <span className={`badge ${cls}`}>{text}</span>;
}

export default function AuditoriaDefectos({ accent }) {
  const [desde, setDesde] = useState(defaultDesde);
  const [hasta, setHasta] = useState(today);
  const [familiaDefecto, setFamiliaDefecto] = useState('');
  const [cliente, setCliente] = useState('todos');
  const [familiaProducto, setFamiliaProducto] = useState('');
  const [familiasDefecto, setFamiliasDefecto] = useState(EMPTY_ARRAY);
  const [loadingFamilias, setLoadingFamilias] = useState(true);
  const [data, setData] = useState(null);
  const [expandedTarimaKey, setExpandedTarimaKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await postAuditoriaDefectos({ desde, hasta, familiaDefecto, cliente, familiaProducto }));
      setExpandedTarimaKey(null);
    } catch (loadError) {
      setData(null);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    getDefectosFamilias({ desde, hasta, cliente, tipoProceso: familiaProducto })
      .then((payload) => {
        if (ignore) return;
        const familias = (Array.isArray(payload) ? payload : EMPTY_ARRAY)
          .map((item) => item.familia)
          .filter(Boolean);

        setFamiliasDefecto(familias);
        setFamiliaDefecto((actual) => (actual && !familias.includes(actual) ? '' : actual));
      })
      .catch(() => {
        if (!ignore) setFamiliasDefecto(EMPTY_ARRAY);
      })
      .finally(() => {
        if (!ignore) setLoadingFamilias(false);
      });

    return () => { ignore = true; };
  }, [desde, hasta, cliente, familiaProducto]);

  useEffect(() => {
    let ignore = false;

    postAuditoriaDefectos({ desde, hasta, familiaDefecto, cliente, familiaProducto })
      .then((payload) => {
        if (!ignore) {
          setData(payload);
          setExpandedTarimaKey(null);
        }
      })
      .catch((loadError) => {
        if (!ignore) {
          setData(null);
          setError(loadError.message);
        }
      })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [desde, hasta, familiaDefecto, cliente, familiaProducto]);

  const resumen = data || EMPTY_OBJECT;
  const tarimasDetalle = Array.isArray(resumen.tarimasDetalle) ? resumen.tarimasDetalle : EMPTY_ARRAY;

  const kpis = useMemo(() => ([
    { label: 'Tarimas afectadas', value: fmt(resumen.totalTarimasAfectadas), icon: Layers, accent },
    { label: 'Tarimas rechazadas', value: fmt(resumen.tarimasRechazadas), icon: PackageX, accent: '#A80000', color: '#A80000' },
    { label: 'Tarimas desviadas', value: fmt(resumen.tarimasDesviadas), icon: AlertTriangle, accent: '#D29200', color: '#D29200' },
    { label: 'Cajas afectadas', value: fmt(resumen.totalCajasAfectadas), icon: Boxes, accent: '#00B7C3' },
    { label: 'Piezas afectadas', value: fmt(resumen.totalPiezasAfectadas), icon: CheckSquare, accent },
  ]), [accent, resumen]);

  return (
    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#252423' }}>
          <Search size={15} color={accent} /> Auditoria de defectos
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Desde
          <input className="pbi-input" type="date" value={desde} onChange={(event) => { setLoading(true); setLoadingFamilias(true); setDesde(event.target.value); }} style={{ width: 140 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Hasta
          <input className="pbi-input" type="date" value={hasta} onChange={(event) => { setLoading(true); setLoadingFamilias(true); setHasta(event.target.value); }} style={{ width: 140 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Familia defecto
          <select
            className="pbi-select"
            value={familiaDefecto}
            onChange={(event) => { setLoading(true); setFamiliaDefecto(event.target.value); }}
            disabled={loadingFamilias}
            style={{ minWidth: 210 }}
          >
            <option value="">Todas</option>
            {familiasDefecto.length ? (
              familiasDefecto.map((item) => <option key={item} value={item}>{item}</option>)
            ) : (
              <option value="" disabled>{loadingFamilias ? 'Cargando familias...' : 'Sin familias'}</option>
            )}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Cliente
          <select className="pbi-select" value={cliente} onChange={(event) => { setLoading(true); setLoadingFamilias(true); setCliente(event.target.value); }} style={{ minWidth: 150 }}>
            <option value="todos">Todos</option>
            {CLIENTES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Familia producto
          <select className="pbi-select" value={familiaProducto} onChange={(event) => { setLoading(true); setLoadingFamilias(true); setFamiliaProducto(event.target.value); }} style={{ minWidth: 140 }}>
            <option value="">Todas</option>
            {FAMILIAS_PRODUCTO.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, .8fr)', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
          {kpis.map((kpi) => <KPICard key={kpi.label} {...kpi} />)}
        </div>

        <div className="card" style={{ padding: '12px 14px', background: '#EFF6FF', borderLeft: `4px solid ${accent}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={16} color={accent} />
            <div style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8' }}>Lectura de auditoria</div>
          </div>
          <div style={{ fontSize: 12, color: '#1E3A8A', lineHeight: 1.55 }}>
            Esta vista muestra únicamente las tarimas <strong>rechazadas</strong> y <strong>desviadas</strong>. Al desplegar una tarima, se presenta el informe de las cajas individuales asociadas para auditar el detalle del defecto.
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', minHeight: 360 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#252423' }}>Auditoria de tarimas y cajas asociadas</div>
            <div style={{ fontSize: 10, color: '#A19F9D', marginTop: 2 }}>
              {fmt(tarimasDetalle.length)} tarimas fisicas. Expande una fila para ver las cajas unitarias asociadas.
            </div>
          </div>
        </div>

        {loading ? (
          <EmptyState text="Cargando auditoria..." />
        ) : tarimasDetalle.length ? (
          <div style={{ overflow: 'auto', maxHeight: 520 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 42 }} />
                  <th>Lote</th>
                  <th>Cliente</th>
                  <th>PrintCard</th>
                  <th>Tarima</th>
                  <th>Estatus</th>
                  <th>Fecha</th>
                  <th>Defectos especificos</th>
                </tr>
              </thead>
              <tbody>
                {tarimasDetalle.map((row, index) => {
                  const rowKey = `${valueOf(row, ['tarimaId', 'numeroTarima', 'tarima'], index)}-${valueOf(row, ['lote', 'printCard'], index)}`;
                  const isExpanded = expandedTarimaKey === rowKey;
                  const cajasAsociadas = Array.isArray(row.cajasAsociadas) ? row.cajasAsociadas : EMPTY_ARRAY;
                  return (
                    <Fragment key={rowKey}>
                      <tr key={rowKey}>
                        <td>
                          <button
                            type="button"
                            onClick={() => setExpandedTarimaKey(isExpanded ? null : rowKey)}
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
                            aria-label={isExpanded ? 'Contraer tarima' : 'Expandir tarima'}
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </td>
                        <td>{valueOf(row, ['lote', 'numeroOrden'], '-')}</td>
                        <td>{valueOf(row, ['cliente'], '-')}</td>
                        <td>{valueOf(row, ['printCard'], '-')}</td>
                        <td>{valueOf(row, ['numeroTarima', 'tarimaId', 'tarima'], '-')}</td>
                        <td><BadgeEstatus value={valueOf(row, ['estatusCierre', 'estatus'], '-')} /></td>
                        <td>{fmtDate(valueOf(row, ['fecha', 'fechaCierre', 'fechaEscaneo'], ''))}</td>
                        <td style={{ whiteSpace: 'normal', minWidth: 260 }}>{valueOf(row, ['defectosDetectados'], '-')}</td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${rowKey}-cajas`}>
                          <td colSpan={8} style={{ background: '#FAFAFA', padding: 10 }}>
                            {cajasAsociadas.length ? (
                              <div style={{ border: '1px solid #EDEBE9', borderRadius: 4, overflow: 'hidden' }}>
                                <table className="tbl">
                                  <thead>
                                    <tr>
                                      <th>Lote</th>
                                      <th>Cliente</th>
                                      <th>Error puntual</th>
                                      <th>Piezas caja</th>
                                      <th>Fecha escaneo</th>
                                      <th>Operador</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {cajasAsociadas.map((caja, cajaIndex) => (
                                      <tr key={`${rowKey}-caja-${valueOf(caja, ['cajaId', 'id'], cajaIndex)}`}>
                                        <td>{valueOf(caja, ['lote', 'printCard', 'numeroOrden'], valueOf(row, ['lote', 'numeroOrden'], '-'))}</td>
                                        <td>{valueOf(caja, ['cliente'], valueOf(row, ['cliente'], '-'))}</td>
                                        <td style={{ whiteSpace: 'normal', minWidth: 220 }}>{valueOf(caja, ['defectoEspecifico', 'defecto', 'detalle'], '-')}</td>
                                        <td>{fmt(valueOf(caja, ['cantidadPiezas', 'piezasCaja', 'piezas'], 0))}</td>
                                        <td>{fmtDate(valueOf(caja, ['fechaEscaneo', 'fecha'], ''))}</td>
                                        <td>{valueOf(caja, ['usuarioValidador', 'operadora', 'operador'], '-')}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div style={{ color: '#A19F9D', fontSize: 12, padding: 8 }}>Esta tarima no tiene cajas asociadas en la respuesta.</div>
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
        ) : <EmptyState />}
      </div>
    </div>
  );
}
