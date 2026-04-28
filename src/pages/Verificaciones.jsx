import { useEffect, useMemo, useState } from 'react';
import { Search, X, Camera, CheckSquare, AlertTriangle, ChevronRight, RefreshCw } from 'lucide-react';
import {
  getFileUrl,
  getReporteEvidencias,
  getVerificacionesConFotos,
} from '../services/verificacionApi';

const SEV_BADGE = {
  'EN PROCESO': 'badge-active',
  TERMINADO: 'badge-done',
  TERMINADA: 'badge-done',
  RECHAZADA: 'badge-critical',
};

const EMPTY_ARRAY = [];

function firstValue(source, keys, fallback = '') {
  const key = keys.find((item) => source?.[item] !== undefined && source?.[item] !== null);
  return key ? source[key] : fallback;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-MX');
}

function formatMinutes(value) {
  const minutes = Number(value || 0);
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours ? `${hours}h ${mins}m` : `${mins}m`;
}

function normalizeStatus(value) {
  const status = String(value || '').trim().toUpperCase();
  if (status.includes('PROCESO') || status.includes('ACTIV')) return 'EN PROCESO';
  if (status.includes('TERMIN') || status.includes('CERRAD') || status.includes('APROBAD')) return 'TERMINADO';
  if (status.includes('RECHAZ')) return 'RECHAZADA';
  return status || 'SIN ESTADO';
}

function normalizePhotos(source) {
  const raw = firstValue(source, ['fotos', 'photos', 'imagenes', 'evidencias', 'rutasFotos'], []);
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === 'string') return getFileUrl(item);
    return getFileUrl(firstValue(item, ['ruta', 'url', 'path', 'rutaFoto', 'foto'], ''));
  }).filter(Boolean);
}

function normalizeDefects(source) {
  const raw = firstValue(source, ['defectos', 'hallazgos', 'detallesDefectos'], []);
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => ({
    id: firstValue(item, ['id', 'defectoId'], index),
    familia: firstValue(item, ['familia', 'tipo', 'categoria'], 'Defecto'),
    detalle: firstValue(item, ['detalle', 'descripcion', 'defecto'], ''),
    piezasAfectadas: Number(firstValue(item, ['piezasAfectadas', 'cantidadPiezas', 'piezas'], 0)),
    veces: Number(firstValue(item, ['veces', 'vecesPresentado', 'cantidad'], 0)),
  }));
}

function normalizeVerification(source) {
  const id = firstValue(source, ['id', 'verificacionId', 'idVerificacion']);
  const defects = normalizeDefects(source);
  const photoCount = Number(firstValue(source, ['fotos', 'totalFotos', 'cantidadFotos', 'fotosRegistradas'], 0));
  return {
    raw: source,
    id,
    lote: firstValue(source, ['lote', 'numeroOrden', 'orden', 'folio'], ''),
    cliente: firstValue(source, ['cliente', 'nombreCliente', 'customer'], ''),
    producto: firstValue(source, ['producto', 'nombreProducto', 'descripcionProducto'], ''),
    inspector: firstValue(source, ['inspector', 'usuario', 'operadora', 'creadoPor'], ''),
    fechaInicio: firstValue(source, ['fechaInicio', 'fecha', 'createdAt'], ''),
    fechaFin: firstValue(source, ['fechaFin', 'fechaCierre', 'fechaTermino'], ''),
    tiempoTotalMinutos: Number(firstValue(source, ['tiempoTotalMinutos', 'minutosTotales', 'duracionMinutos'], 0)),
    totalCajas: Number(firstValue(source, ['totalCajas', 'cajasRegistradas', 'cajas'], 0)),
    totalPiezas: Number(firstValue(source, ['totalPiezas', 'piezas'], 0)),
    totalTarimas: Number(firstValue(source, ['totalTarimas', 'tarimas'], 0)),
    muestreo: firstValue(source, ['muestreo', 'descripcionMuestreo'], ''),
    comentarios: firstValue(source, ['comentarios', 'comentarioCierre', 'observaciones'], ''),
    fecha: formatDate(firstValue(source, ['fecha', 'fechaInicio', 'fechaCierre', 'fechaFin', 'createdAt'], '')),
    estado: normalizeStatus(firstValue(source, ['estado', 'estatus', 'status'], '')),
    fotos: Number.isNaN(photoCount) ? 0 : photoCount,
    hallazgos: Number(firstValue(source, ['hallazgos', 'totalDefectos', 'defectosCount'], defects.length)) || defects.length,
    descripcion: firstValue(source, ['descripcion', 'comentarios', 'observaciones'], ''),
    notas: firstValue(source, ['notas', 'comentarios', 'observaciones'], ''),
    defectos: defects,
    fotosUrls: normalizePhotos(source),
  };
}

function SortTh({ col, label, sort, onSort }) {
  return (
    <th onClick={() => onSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      {label} {sort.key === col ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );
}

function LoadingState({ accent, text = 'Cargando...' }) {
  return (
    <div style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#A19F9D', fontSize: 12 }}>
      <div className="loading-spinner" style={{ borderTopColor: accent }} />
      <div>{text}</div>
    </div>
  );
}

function DetailPanel({ v, loading, error, onClose, accent }) {
  if (!v) return null;

  return (
    <div className="fade-in" style={{
      width: 360, flexShrink: 0, background: '#fff', borderLeft: '1px solid #EDEBE9',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #EDEBE9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>Verificación #{String(v.id).padStart(4, '0')}</div>
          <div style={{ fontSize: 10, color: '#A19F9D' }}>{v.lote}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A19F9D', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading && (
          <div style={{ border: '1px solid #EDEBE9', borderRadius: 4, padding: 14, display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2, borderTopColor: accent }} />
              <span style={{ fontSize: 12, color: '#605E5C', fontWeight: 600 }}>Cargando reporte de evidencias...</span>
            </div>
            <div className="skeleton-line" style={{ width: '80%' }} />
            <div className="skeleton-line" style={{ width: '64%' }} />
            <div className="skeleton-line" style={{ width: '92%' }} />
          </div>
        )}
        {error && <div style={{ background: '#FDE7E9', color: '#A80000', borderRadius: 4, padding: 8, fontSize: 11 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className={`badge ${SEV_BADGE[v.estado] || 'badge-minor'}`}>
            {v.estado === 'EN PROCESO' ? '● En proceso' : v.estado === 'RECHAZADA' ? 'Rechazada' : '✓ Terminado'}
          </span>
          {v.hallazgos > 0 && (
            <span className={`badge ${v.hallazgos >= 2 ? 'badge-critical' : 'badge-major'}`}>
              {v.hallazgos} defecto{v.hallazgos !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {[
            ['Cliente', v.cliente],
            ['Producto', v.producto],
            ['Lote', v.lote],
            ['Fecha inicio', formatDateTime(v.fechaInicio)],
            ['Fecha fin', formatDateTime(v.fechaFin)],
            ['Tiempo total', formatMinutes(v.tiempoTotalMinutos)],
            ['Muestreo', v.muestreo],
            ['Comentarios', v.comentarios],
          ].map(([k, val]) => (
            <div key={k}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#A19F9D', marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 12, color: '#252423', fontWeight: 500, lineHeight: 1.45 }}>{val || 'Sin dato'}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            ['Cajas', formatNumber(v.totalCajas)],
            ['Piezas', formatNumber(v.totalPiezas)],
            ['Tarimas', formatNumber(v.totalTarimas)],
          ].map(([label, value]) => (
            <div key={label} style={{ background: '#F3F2F1', borderRadius: 4, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: '#605E5C' }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#252423' }}>{value}</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#A19F9D', marginBottom: 8 }}>Evidencia fotográfica</div>
          {v.fotosUrls.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {v.fotosUrls.map((url, i) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" style={{ display: 'block', aspectRatio: '1', borderRadius: 4, overflow: 'hidden', border: '1px solid #EDEBE9', background: '#F3F2F1' }}>
                  <img src={url} alt={`Evidencia ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </a>
              ))}
            </div>
          ) : (
            <div style={{ minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid #EDEBE9', borderRadius: 4, color: '#A19F9D', fontSize: 11 }}>
              <Camera size={15} /> Sin fotos en el reporte
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function Verificaciones({ accent, desde, hasta }) {
  const [verificaciones, setVerificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('todas');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [sort, setSort] = useState({ key: 'id', dir: 'desc' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await getVerificacionesConFotos({ desde, hasta });
      const rows = Array.isArray(payload) ? payload : firstValue(payload, ['verificaciones', 'data', 'items'], EMPTY_ARRAY);
      setVerificaciones(rows.map(normalizeVerification));
    } catch (requestError) {
      setError(requestError.message);
      setVerificaciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    getVerificacionesConFotos({ desde, hasta })
      .then((payload) => {
        if (!ignore) {
          const rows = Array.isArray(payload) ? payload : firstValue(payload, ['verificaciones', 'data', 'items'], EMPTY_ARRAY);
          setVerificaciones(rows.map(normalizeVerification));
        }
      })
      .catch((requestError) => {
        if (!ignore) {
          setError(requestError.message);
          setVerificaciones([]);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [desde, hasta]);

  const openDetail = async (row) => {
    setSelected(row);
    setDetailLoading(true);
    setDetailError('');
    try {
      const detail = await getReporteEvidencias(row.id);
      setSelected({ ...row, ...normalizeVerification({ ...row.raw, ...detail }) });
    } catch (requestError) {
      setDetailError(requestError.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...verificaciones];
    if (tab === 'activas') list = list.filter((v) => v.estado === 'EN PROCESO');
    if (tab === 'cerradas') list = list.filter((v) => v.estado !== 'EN PROCESO');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        v.lote.toLowerCase().includes(q) ||
        v.cliente.toLowerCase().includes(q) ||
        v.producto.toLowerCase().includes(q) ||
        v.inspector.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const va = a[sort.key] ?? '';
      const vb = b[sort.key] ?? '';
      return sort.dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return list;
  }, [tab, search, sort, verificaciones]);

  const handleSort = (key) => {
    setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const totalActivas = verificaciones.filter((v) => v.estado === 'EN PROCESO').length;
  const totalCerradas = verificaciones.length - totalActivas;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Total', value: verificaciones.length, icon: <CheckSquare size={16} color={accent} />, accent },
              { label: 'En proceso', value: totalActivas, icon: <AlertTriangle size={16} color="#F2C812" />, accent: '#F2C812' },
              { label: 'Cerradas', value: totalCerradas, icon: <CheckSquare size={16} color="#107C10" />, accent: '#107C10' },
            ].map((k) => (
              <div key={k.label} className="card" style={{ padding: '12px 14px', borderTop: `3px solid ${k.accent}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="kpi-label">{k.label}</div>
                    <div className="kpi-value" style={{ marginTop: 4 }}>{k.value}</div>
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: 4, background: `${k.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {k.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
              <Search size={13} color="#A19F9D" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="pbi-input"
                placeholder="Buscar lote, cliente, producto..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={{ paddingLeft: 28 }}
              />
            </div>
            <div className="tab-bar" style={{ border: 'none', marginBottom: 0, gap: 2 }}>
              {[['todas', 'Todas'], ['activas', 'En Proceso'], ['cerradas', 'Cerradas']].map(([k, l]) => (
                <div
                  key={k}
                  className={`tab ${tab === k ? 'active' : ''}`}
                  style={{ borderBottomColor: tab === k ? accent : undefined, color: tab === k ? accent : undefined, padding: '4px 12px' }}
                  onClick={() => setTab(k)}
                >{l}</div>
              ))}
            </div>
            <button className="filter-btn" onClick={load} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} /> {loading ? 'Cargando' : 'Actualizar'}
            </button>
            <div style={{ marginLeft: 'auto', fontSize: 11, color: error ? '#A80000' : '#A19F9D' }}>
              {error || `${filtered.length} verificaciones`}
            </div>
          </div>

          <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <SortTh col="id" label="ID" sort={sort} onSort={handleSort} />
                    <SortTh col="lote" label="Lote" sort={sort} onSort={handleSort} />
                    <SortTh col="cliente" label="Cliente" sort={sort} onSort={handleSort} />
                    <SortTh col="producto" label="Producto" sort={sort} onSort={handleSort} />
                    <SortTh col="inspector" label="Inspector" sort={sort} onSort={handleSort} />
                    <SortTh col="fecha" label="Fecha" sort={sort} onSort={handleSort} />
                    <th>Estado</th>
                    <th>Fotos</th>
                    <th>Defectos</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => (
                    <tr key={v.id} onClick={() => openDetail(v)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: accent, fontWeight: 700 }}>#{String(v.id).padStart(4, '0')}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{v.lote}</td>
                      <td style={{ fontWeight: 600, fontSize: 12 }}>{v.cliente}</td>
                      <td style={{ fontSize: 11, color: '#605E5C' }}>{v.producto}</td>
                      <td style={{ fontSize: 11 }}>{v.inspector}</td>
                      <td style={{ fontSize: 11, color: '#A19F9D' }}>{v.fecha}</td>
                      <td>
                        <span className={`badge ${SEV_BADGE[v.estado] || 'badge-minor'}`}>
                          {v.estado === 'EN PROCESO' ? '● En proceso' : v.estado === 'RECHAZADA' ? 'Rechazada' : '✓ Terminado'}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#605E5C' }}>
                          <Camera size={11} color="#A19F9D" /> {v.fotos || v.fotosUrls.length}
                        </span>
                      </td>
                      <td>
                        {v.hallazgos > 0
                          ? <span className={`badge ${v.hallazgos >= 2 ? 'badge-critical' : 'badge-major'}`}>{v.hallazgos}</span>
                          : <span style={{ color: '#A19F9D', fontSize: 11 }}>—</span>}
                      </td>
                      <td><ChevronRight size={14} color="#C8C6C4" /></td>
                    </tr>
                  ))}
                  {!loading && !filtered.length && (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', color: '#A19F9D', padding: 24 }}>
                        {error ? 'No se pudieron cargar las verificaciones.' : 'Sin verificaciones para mostrar.'}
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan={10} style={{ padding: 24 }}>
                        <LoadingState accent={accent} text="Cargando verificaciones..." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <DetailPanel
          v={selected}
          loading={detailLoading}
          error={detailError}
          onClose={() => setSelected(null)}
          accent={accent}
        />
      )}
    </div>
  );
}
