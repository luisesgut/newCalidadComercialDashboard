import { useState, useMemo } from 'react';
import { Search, X, Camera, CheckSquare, AlertTriangle, ChevronRight } from 'lucide-react';
import { verificaciones } from '../data/mockData';

const SEV_BADGE = {
  'EN PROCESO': 'badge-active',
  'TERMINADO':  'badge-done',
};

function DetailPanel({ v, onClose, accent }) {
  if (!v) return null;
  return (
    <div className="fade-in" style={{
      width: 320, flexShrink: 0, background: '#fff', borderLeft: '1px solid #EDEBE9',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #EDEBE9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#252423' }}>Verificación #{String(v.id).padStart(4,'0')}</div>
          <div style={{ fontSize: 10, color: '#A19F9D' }}>{v.lote}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A19F9D', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Status */}
        <div style={{ display: 'flex', gap: 8 }}>
          <span className={`badge ${SEV_BADGE[v.estado]}`}>
            {v.estado === 'EN PROCESO' ? '● En proceso' : '✓ Terminado'}
          </span>
          {v.hallazgos > 0 && (
            <span className={`badge ${v.hallazgos >= 2 ? 'badge-critical' : 'badge-major'}`}>
              {v.hallazgos} hallazgo{v.hallazgos !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Info grid */}
        {[
          ['Cliente',    v.cliente],
          ['Producto',   v.producto],
          ['Inspector',  v.inspector],
          ['Fecha',      v.fecha],
        ].map(([k, val]) => (
          <div key={k}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#A19F9D', marginBottom: 2 }}>{k}</div>
            <div style={{ fontSize: 12, color: '#252423', fontWeight: 500 }}>{val}</div>
          </div>
        ))}

        {/* Photos */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#A19F9D', marginBottom: 8 }}>Evidencia fotográfica</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {Array.from({ length: v.fotos }).map((_, i) => (
              <div key={i} style={{
                aspectRatio: '1', background: '#F3F2F1', borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 4, border: '1px solid #EDEBE9',
              }}>
                <Camera size={16} color="#C8C6C4" />
                <span style={{ fontSize: 9, color: '#C8C6C4' }}>Foto {i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        {v.descripcion && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#A19F9D', marginBottom: 4 }}>Descripción</div>
            <div style={{ fontSize: 11, color: '#605E5C', lineHeight: 1.6 }}>{v.descripcion}</div>
          </div>
        )}

        {/* Notes */}
        {v.notas && (
          <div style={{ background: '#FFF4CE', borderRadius: 4, padding: '8px 10px', borderLeft: '3px solid #F2C812' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#7A4F01', marginBottom: 2 }}>Notas</div>
            <div style={{ fontSize: 11, color: '#7A4F01' }}>{v.notas}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #EDEBE9', display: 'flex', gap: 8 }}>
        <button style={{
          flex: 1, padding: '7px 12px', borderRadius: 4, border: 'none',
          background: accent, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>Editar</button>
        <button style={{
          padding: '7px 12px', borderRadius: 4, border: '1px solid #EDEBE9',
          background: '#fff', color: '#252423', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>Exportar</button>
      </div>
    </div>
  );
}

export default function Verificaciones({ accent }) {
  const [search,   setSearch]   = useState('');
  const [tab,      setTab]      = useState('todas');
  const [selected, setSelected] = useState(null);
  const [sort,     setSort]     = useState({ key: 'id', dir: 'desc' });

  const filtered = useMemo(() => {
    let list = [...verificaciones];
    if (tab === 'activas')  list = list.filter(v => v.estado === 'EN PROCESO');
    if (tab === 'cerradas') list = list.filter(v => v.estado === 'TERMINADO');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        v.lote.toLowerCase().includes(q) ||
        v.cliente.toLowerCase().includes(q) ||
        v.producto.toLowerCase().includes(q) ||
        v.inspector.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key];
      return sort.dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return list;
  }, [tab, search, sort]);

  const handleSort = (key) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const SortTh = ({ col, label }) => (
    <th onClick={() => handleSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      {label} {sort.key === col ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflow: 'hidden' }}>

          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Total este mes',  value: verificaciones.length,                                  icon: <CheckSquare size={16} color={accent} />,     accent },
              { label: 'En proceso',      value: verificaciones.filter(v => v.estado === 'EN PROCESO').length, icon: <AlertTriangle size={16} color="#F2C812" />, accent: '#F2C812' },
              { label: 'Terminadas',      value: verificaciones.filter(v => v.estado === 'TERMINADO').length,  icon: <CheckSquare size={16} color="#107C10" />,   accent: '#107C10' },
              { label: 'Con hallazgos',   value: verificaciones.filter(v => v.hallazgos > 0).length,          icon: <AlertTriangle size={16} color="#A80000" />, accent: '#A80000' },
            ].map(k => (
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

          {/* Toolbar */}
          <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
              <Search size={13} color="#A19F9D" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="pbi-input"
                placeholder="Buscar lote, cliente, producto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 28 }}
              />
            </div>
            <div className="tab-bar" style={{ border: 'none', marginBottom: 0, gap: 2 }}>
              {[['todas','Todas'], ['activas','En Proceso'], ['cerradas','Terminadas']].map(([k, l]) => (
                <div key={k}
                  className={`tab ${tab === k ? 'active' : ''}`}
                  style={{ borderBottomColor: tab === k ? accent : undefined, color: tab === k ? accent : undefined, padding: '4px 12px' }}
                  onClick={() => setTab(k)}
                >{l}</div>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 11, color: '#A19F9D' }}>
              {filtered.length} verificaciones
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <SortTh col="id"        label="ID" />
                    <SortTh col="lote"      label="Lote" />
                    <SortTh col="cliente"   label="Cliente" />
                    <SortTh col="producto"  label="Producto" />
                    <SortTh col="inspector" label="Inspector" />
                    <SortTh col="fecha"     label="Fecha" />
                    <th>Estado</th>
                    <th>Fotos</th>
                    <th>Hallazgos</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v => (
                    <tr key={v.id} onClick={() => setSelected(v)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: accent, fontWeight: 700 }}>#{String(v.id).padStart(4,'0')}</td>
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
                          <Camera size={11} color="#A19F9D" /> {v.fotos}
                        </span>
                      </td>
                      <td>
                        {v.hallazgos > 0
                          ? <span className={`badge ${v.hallazgos >= 2 ? 'badge-critical' : 'badge-major'}`}>{v.hallazgos}</span>
                          : <span style={{ color: '#A19F9D', fontSize: 11 }}>—</span>
                        }
                      </td>
                      <td>
                        <ChevronRight size={14} color="#C8C6C4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <DetailPanel v={selected} onClose={() => setSelected(null)} accent={accent} />
      )}
    </div>
  );
}
