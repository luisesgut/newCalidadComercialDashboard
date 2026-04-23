import { useState, useMemo } from 'react';
import { Search, AlertTriangle, CheckCircle, XCircle, Clock, ChevronRight, X } from 'lucide-react';
import { hallazgos } from '../data/mockData';

const SEV_STYLE = {
  'CRÍTICO': { badge: 'badge-critical',  dot: '#A80000' },
  'MAYOR':   { badge: 'badge-major',     dot: '#F2C812' },
  'MENOR':   { badge: 'badge-minor',     dot: '#0078D4' },
};

const TIPO_COLORS = {
  'Inocuidad':     '#A80000',
  'Calidad Visual':'#F2C812',
  'Dimensiones':   '#0078D4',
  'Etiquetado':    '#8B5CF6',
  'Empaque':       '#00B7C3',
};

function DetailPanel({ h, onClose, accent }) {
  if (!h) return null;
  const sev = SEV_STYLE[h.severidad] || SEV_STYLE['MENOR'];
  return (
    <div className="fade-in" style={{
      width: 320, flexShrink: 0, background: '#fff', borderLeft: '1px solid #EDEBE9',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #EDEBE9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#252423' }}>Hallazgo {h.id}</div>
          <div style={{ fontSize: 10, color: '#A19F9D' }}>Verificación #{String(h.verificacion).padStart(4,'0')}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A19F9D', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className={`badge ${sev.badge}`}>{h.severidad}</span>
          <span className={`badge ${h.estado === 'CERRADO' ? 'badge-done' : 'badge-active'}`}>
            {h.estado === 'CERRADO' ? '✓ Cerrado' : '● Abierto'}
          </span>
        </div>

        {[
          ['Tipo',       h.tipo],
          ['Cliente',    h.cliente],
          ['Lote',       h.lote],
          ['Inspector',  h.inspector],
          ['Fecha',      h.fecha],
        ].map(([k, val]) => (
          <div key={k}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#A19F9D', marginBottom: 2 }}>{k}</div>
            <div style={{ fontSize: 12, color: '#252423', fontWeight: 500 }}>{val}</div>
          </div>
        ))}

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#A19F9D', marginBottom: 4 }}>Descripción</div>
          <div style={{ fontSize: 11, color: '#605E5C', lineHeight: 1.6 }}>{h.descripcion}</div>
        </div>

        <div style={{ background: '#F3F2F1', borderRadius: 4, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#605E5C', marginBottom: 2 }}>Acción tomada</div>
          <div style={{ fontSize: 11, color: '#252423' }}>{h.accion}</div>
        </div>
      </div>

      <div style={{ padding: '10px 16px', borderTop: '1px solid #EDEBE9', display: 'flex', gap: 8 }}>
        <button style={{
          flex: 1, padding: '7px 12px', borderRadius: 4, border: 'none',
          background: h.estado === 'CERRADO' ? '#EDEBE9' : accent,
          color: h.estado === 'CERRADO' ? '#605E5C' : '#fff',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>
          {h.estado === 'CERRADO' ? 'Reabrir' : 'Cerrar hallazgo'}
        </button>
      </div>
    </div>
  );
}

export default function Hallazgos({ accent }) {
  const [search,   setSearch]   = useState('');
  const [tab,      setTab]      = useState('todos');
  const [sevFilt,  setSevFilt]  = useState('Todos');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    let list = [...hallazgos];
    if (tab === 'abiertos') list = list.filter(h => h.estado === 'ABIERTO');
    if (tab === 'cerrados') list = list.filter(h => h.estado === 'CERRADO');
    if (sevFilt !== 'Todos') list = list.filter(h => h.severidad === sevFilt);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(h =>
        h.id.toLowerCase().includes(q) ||
        h.descripcion.toLowerCase().includes(q) ||
        h.cliente.toLowerCase().includes(q) ||
        h.tipo.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tab, sevFilt, search]);

  const counts = useMemo(() => ({
    total:    hallazgos.length,
    abiertos: hallazgos.filter(h => h.estado === 'ABIERTO').length,
    cerrados: hallazgos.filter(h => h.estado === 'CERRADO').length,
    criticos: hallazgos.filter(h => h.severidad === 'CRÍTICO').length,
  }), []);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflow: 'hidden' }}>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Total hallazgos',  value: counts.total,    accent, icon: <AlertTriangle size={16} color={accent} /> },
              { label: 'Abiertos',         value: counts.abiertos, accent: '#F2C812', icon: <Clock size={16} color="#F2C812" /> },
              { label: 'Cerrados',         value: counts.cerrados, accent: '#107C10', icon: <CheckCircle size={16} color="#107C10" /> },
              { label: 'Críticos',         value: counts.criticos, accent: '#A80000', icon: <XCircle size={16} color="#A80000" /> },
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
          <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 280 }}>
              <Search size={13} color="#A19F9D" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="pbi-input"
                placeholder="Buscar hallazgo, tipo, cliente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 28 }}
              />
            </div>
            <div className="tab-bar" style={{ border: 'none', marginBottom: 0, gap: 2 }}>
              {[['todos','Todos'], ['abiertos','Abiertos'], ['cerrados','Cerrados']].map(([k, l]) => (
                <div key={k}
                  className={`tab ${tab === k ? 'active' : ''}`}
                  style={{ borderBottomColor: tab === k ? accent : undefined, color: tab === k ? accent : undefined, padding: '4px 12px' }}
                  onClick={() => setTab(k)}
                >{l}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Todos', 'CRÍTICO', 'MAYOR', 'MENOR'].map(s => (
                <button key={s}
                  className={`filter-btn ${sevFilt === s ? 'active' : ''}`}
                  style={{ background: sevFilt === s ? (s === 'CRÍTICO' ? '#A80000' : s === 'MAYOR' ? '#7A4F01' : s === 'MENOR' ? '#0078D4' : accent) : undefined,
                           borderColor: sevFilt === s ? 'transparent' : undefined }}
                  onClick={() => setSevFilt(s)}
                >{s}</button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 11, color: '#A19F9D' }}>
              {filtered.length} hallazgos
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Verificación</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Severidad</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Inspector</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(h => {
                    const sev = SEV_STYLE[h.severidad] || SEV_STYLE['MENOR'];
                    return (
                      <tr key={h.id} onClick={() => setSelected(h)}>
                        <td style={{ fontFamily: 'monospace', fontSize: 11, color: accent, fontWeight: 700 }}>{h.id}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 11 }}>#{String(h.verificacion).padStart(4,'0')}</td>
                        <td style={{ fontWeight: 600, fontSize: 12 }}>{h.cliente}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                            <div style={{ width: 7, height: 7, borderRadius: 2, background: TIPO_COLORS[h.tipo] || '#A19F9D', flexShrink: 0 }} />
                            {h.tipo}
                          </span>
                        </td>
                        <td><span className={`badge ${sev.badge}`}>{h.severidad}</span></td>
                        <td style={{ fontSize: 11, color: '#605E5C', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.descripcion}</td>
                        <td>
                          <span className={`badge ${h.estado === 'CERRADO' ? 'badge-done' : 'badge-active'}`}>
                            {h.estado === 'CERRADO' ? '✓ Cerrado' : '● Abierto'}
                          </span>
                        </td>
                        <td style={{ fontSize: 11, color: '#A19F9D' }}>{h.fecha}</td>
                        <td style={{ fontSize: 11 }}>{h.inspector}</td>
                        <td><ChevronRight size={14} color="#C8C6C4" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <DetailPanel h={selected} onClose={() => setSelected(null)} accent={accent} />
      )}
    </div>
  );
}
