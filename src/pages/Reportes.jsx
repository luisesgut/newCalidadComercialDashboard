import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { AlertTriangle, Download, FileSpreadsheet, Info, RefreshCw, X } from 'lucide-react';

const BASE_URL = 'http://172.16.10.31/api/Verificacion/exportar-excel';
const today = new Date().toISOString().slice(0, 10);
const defaultDesde = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

function buildExcelUrl(desde, hasta) {
  const params = new URLSearchParams();
  if (desde) params.set('desde', desde);
  if (hasta) params.set('hasta', hasta);
  const query = params.toString();
  return `${BASE_URL}${query ? '?' + query : ''}`;
}

function parseExcelPreview(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
  const headers = rows[2] || [];
  const body = rows
    .slice(3)
    .filter((row) => row.some((cell) => String(cell).trim() !== ''));

  return {
    title: rows[0]?.[0] || 'Reporte de verificaciones',
    period: rows[1]?.[0] || '',
    headers,
    rows: body,
  };
}

export default function Reportes({ accent, initialDesde = defaultDesde, initialHasta = today }) {
  const [desde, setDesde] = useState(initialDesde);
  const [hasta, setHasta] = useState(initialHasta);
  const [preview, setPreview] = useState({ title: '', period: '', headers: [], rows: [] });
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState('');
  const [showIntro, setShowIntro] = useState(true);

  const descargarExcel = () => {
    window.open(buildExcelUrl(desde, hasta), '_blank');
  };

  const limpiarRango = () => {
    setLoadingPreview(true);
    setPreviewError('');
    setDesde('');
    setHasta('');
  };

  const cargarPreview = async () => {
    setLoadingPreview(true);
    setPreviewError('');
    try {
      const response = await fetch(buildExcelUrl(desde, hasta));
      if (!response.ok) throw new Error(`No se pudo cargar el Excel (${response.status})`);

      setPreview(parseExcelPreview(await response.arrayBuffer()));
    } catch (error) {
      setPreview({ title: '', period: '', headers: [], rows: [] });
      setPreviewError(error.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    fetch(buildExcelUrl(desde, hasta))
      .then((response) => {
        if (!response.ok) throw new Error(`No se pudo cargar el Excel (${response.status})`);
        return response.arrayBuffer();
      })
      .then((buffer) => {
        if (ignore) return;
        setPreview(parseExcelPreview(buffer));
      })
      .catch((error) => {
        if (!ignore) {
          setPreview({ title: '', period: '', headers: [], rows: [] });
          setPreviewError(error.message);
        }
      })
      .finally(() => {
        if (!ignore) setLoadingPreview(false);
      });

    return () => {
      ignore = true;
    };
  }, [desde, hasta]);

  return (
    <div className="main-scroll" style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {showIntro && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.28)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div className="card fade-in" style={{ width: 'min(520px, 100%)', padding: 18, boxShadow: '0 16px 40px rgba(0,0,0,.22)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 34, height: 34, borderRadius: 4, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Info size={18} color={accent} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#252423' }}>Reportes de verificaciones</div>
                  <div style={{ fontSize: 11, color: '#A19F9D', marginTop: 2 }}>Exportación para análisis operativo</div>
                </div>
              </div>
              <button onClick={() => setShowIntro(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A19F9D', padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: 12, color: '#605E5C', lineHeight: 1.6, display: 'grid', gap: 10 }}>
              <p>Desde esta sección puedes descargar el Excel de verificaciones para usar los datos como necesites: filtrar, cruzar información, compartirlo o trabajarlo fuera del dashboard.</p>
              <p>Si seleccionas un rango, la descarga se limita a esas fechas. Si dejas vacíos los campos Desde y Hasta, se descarga el histórico completo desde que inició el sistema.</p>
            </div>

            <div style={{ marginTop: 14, background: '#FFF4CE', border: '1px solid #F2C812', borderRadius: 4, padding: '10px 12px', display: 'flex', gap: 8 }}>
              <AlertTriangle size={15} color="#7A4F01" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11, color: '#7A4F01', lineHeight: 1.5 }}>
                Se detectó un bug en los tiempos de verificaciones y ya quedó solucionado. Si encuentran alguna diferencia histórica en tiempos, avísenlo para revisarla.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                onClick={() => setShowIntro(false)}
                style={{
                  padding: '7px 14px', borderRadius: 4, border: 'none',
                  background: accent, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) auto', alignItems: 'center', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 4, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileSpreadsheet size={20} color={accent} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#252423' }}>Descarga de reportes</div>
            <div style={{ fontSize: 11, color: '#A19F9D', marginTop: 2 }}>Selecciona un rango o deja las fechas vacías para exportar todo el histórico.</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
            Desde
            <input
              className="pbi-input"
              type="date"
              value={desde}
              onChange={(e) => {
                setLoadingPreview(true);
                setPreviewError('');
                setDesde(e.target.value);
              }}
              style={{ width: 136 }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
            Hasta
            <input
              className="pbi-input"
              type="date"
              value={hasta}
              onChange={(e) => {
                setLoadingPreview(true);
                setPreviewError('');
                setHasta(e.target.value);
              }}
              style={{ width: 136 }}
            />
          </label>
          <button
            className="filter-btn"
            onClick={limpiarRango}
            style={{ whiteSpace: 'nowrap' }}
          >
            Todo el histórico
          </button>
          <button
            onClick={descargarExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 4, border: 'none',
              background: accent, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
              <Download size={13} /> Descargar Excel
          </button>
        </div>
      </div>

      <div style={{ background: '#FFF4CE', border: '1px solid #F2C812', borderRadius: 4, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <AlertTriangle size={15} color="#7A4F01" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 11, color: '#7A4F01', lineHeight: 1.5 }}>
          Aviso: se detectó un bug en los tiempos de verificaciones y ya quedó solucionado. Si encuentran alguna diferencia en tiempos históricos, repórtenla para revisarla.
        </div>
      </div>

      <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#252423' }}>{preview.title || 'Preview del Excel'}</div>
            <div style={{ fontSize: 10, color: '#A19F9D', marginTop: 2 }}>
              {preview.period || (desde || hasta ? `${desde || 'Inicio'} a ${hasta || 'Hoy'}` : 'Todos los registros')}
              {preview.rows.length > 0 && ` · ${preview.rows.length.toLocaleString('es-MX')} filas`}
            </div>
          </div>
          <button
            className="filter-btn"
            onClick={cargarPreview}
            disabled={loadingPreview}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} /> {loadingPreview ? 'Cargando' : 'Actualizar preview'}
          </button>
        </div>

        {previewError && (
          <div style={{ background: '#FDE7E9', color: '#A80000', borderRadius: 4, padding: 8, fontSize: 11 }}>
            {previewError}
          </div>
        )}

        {!previewError && loadingPreview && (
          <div style={{ minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A19F9D', fontSize: 12 }}>
            Cargando preview del Excel...
          </div>
        )}

        {!previewError && !loadingPreview && preview.rows.length === 0 && (
          <div style={{ minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A19F9D', fontSize: 12 }}>
            Sin datos para el rango seleccionado
          </div>
        )}

        {!previewError && !loadingPreview && preview.rows.length > 0 && (
          <div style={{ overflow: 'auto', maxHeight: 520, border: '1px solid #EDEBE9', borderRadius: 4 }}>
            <table className="tbl" style={{ minWidth: 1500 }}>
              <thead>
                <tr>
                  {preview.headers.map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      style={{ position: 'sticky', top: 0, zIndex: 1, background: '#FAF9F8', whiteSpace: 'nowrap' }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, rowIndex) => (
                  <tr key={`${row[0]}-${rowIndex}`}>
                    {preview.headers.map((_, cellIndex) => (
                      <td
                        key={`${rowIndex}-${cellIndex}`}
                        style={{
                          maxWidth: cellIndex === 2 || cellIndex === 13 ? 280 : 150,
                          whiteSpace: cellIndex === 2 || cellIndex === 13 ? 'normal' : 'nowrap',
                          verticalAlign: 'top',
                          fontSize: 11,
                        }}
                      >
                        {row[cellIndex]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 8px', fontSize: 10, color: '#C8C6C4' }}>
        <span>Bioflex · Calidad Comercial</span>
        <span>Reportes v2.0 · Exportación Excel</span>
      </div>
    </div>
  );
}
