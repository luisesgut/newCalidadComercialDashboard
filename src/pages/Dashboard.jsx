import { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, Cell, CartesianGrid, ComposedChart, Line,
  LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  CalendarDays, CheckSquare, HelpCircle, Package, RefreshCw, Search,
  TrendingUp, Users, X,
} from 'lucide-react';
import KPICard from '../components/KPICard';
import CustomTooltip from '../components/CustomTooltip';
import {
  getDashboardAnalytics,
  getDefectosFamilias,
  getDetalleInteractivo,
  getHistoricoMensual,
  getKpisGlobales,
  getParetoDefectos,
  getTarimasAnalisis,
  getPrintCards,
  getResumenOrden,
} from '../services/verificacionApi';
import { DashboardFilterProvider, useDashboardFilter } from '../context/DashboardFilterContext';

const BX = {
  green900: '#1D3D3A',
  teal700: '#26575B',
  teal500: '#70949C',
  teal200: '#9DC8D1',
  navy: '#2C5992',
  blueReal: '#265897',
  blueBright: '#577CEF',
  success: '#5CBC75',
  mint: '#B9EBC6',
  orange: '#DC6E33',
  amber: '#EDB953',
  yellow: '#F1C870',
  oliveGreen: '#537F5E',
  bg: '#E6EBEE',
  card: '#FFFFFF',
  ink: '#111213',
  border: '#CAD6DA',
  muted: '#5F6E70',
  soft: '#F4F7F8',
};

const COLORS_PIE = [
  BX.teal700, BX.blueReal, BX.success, BX.amber,
  BX.blueBright, BX.orange, BX.yellow, BX.oliveGreen,
  BX.teal500, BX.navy, BX.teal200, BX.green900,
];
const today = new Date().toISOString().slice(0, 10);
const MIN_DASHBOARD_DATE = '2026-07-01';
const defaultDesde = MIN_DASHBOARD_DATE;
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
const CLIENTES = ['Quality', 'Destiny', 'Pollos Guerrero', 'Mr Lucky', 'Mayalatex'];
const AREAS = ['POUCH', 'BOLSEO'];
const ESTATUS_COLORS = {
  Aprobada: BX.success,
  'Con hallazgos': BX.amber,
  'Desviación': BX.teal500,
  Rechazada: BX.orange,
};

const estatusCierreBadge = (estatus) => {
  if (estatus === 'Aprobada') return 'badge-done';
  if (estatus === 'Con hallazgos' || estatus === 'Desviación') return 'badge-major';
  return 'badge-critical';
};

const fmt = (value, digits = 0) => Number(value || 0).toLocaleString('es-MX', {
  maximumFractionDigits: digits,
  minimumFractionDigits: digits,
});

const pct = (value) => `${fmt(value, 1)}%`;
const monthLabel = (item) => item?.nombreMes ? `${item.nombreMes} ${item.anio}` : '';
const fmtDate = (val) => val ? new Date(val).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
const ESTATUS_DESVIACION = 'Desviaci\u00f3n';
const ESTATUS_DESVIACION_LEGACY = Object.keys(ESTATUS_COLORS).find((key) => key.startsWith('Desviaci')) || ESTATUS_DESVIACION;
const ESTATUS_VALIDACION = [
  { key: 'Aprobada', label: 'Aprobadas', field: 'tarimasAprobadas', apiField: 'aprobadas', color: ESTATUS_COLORS.Aprobada },
  { key: 'Con hallazgos', label: 'Con hallazgos', field: 'tarimasConHallazgos', apiField: 'conHallazgos', color: ESTATUS_COLORS['Con hallazgos'] },
  { key: ESTATUS_DESVIACION, label: 'Desviadas', field: 'tarimasDesviadas', apiField: 'desviadas', color: ESTATUS_COLORS[ESTATUS_DESVIACION_LEGACY] },
  { key: 'Rechazada', label: 'Rechazadas', field: 'tarimasRechazadas', apiField: 'rechazadas', color: ESTATUS_COLORS.Rechazada },
];

const normalizeEstatus = (estatus) => (
  typeof estatus === 'string' && estatus.startsWith('Desviaci') ? ESTATUS_DESVIACION : estatus
);

function normalizeSemanaValidacion(semana = {}) {
  const semanaNumero = Number(semana.semana || 0);
  const semanaAnio = Number(semana.semanaAnio ?? semana.anio ?? 0);
  return {
    ...semana,
    semana: semanaNumero,
    semanaAnio,
    semanaKey: `${semanaAnio || 'sin-anio'}-${semanaNumero}`,
    etiqueta: `Sem. ${semanaNumero}`,
    tarimasTotal: Number(semana.totalTarimas ?? semana.tarimasTotal ?? 0),
    tarimasAprobadas: Number(semana.aprobadas ?? semana.tarimasAprobadas ?? 0),
    tarimasConHallazgos: Number(semana.conHallazgos ?? semana.tarimasConHallazgos ?? 0),
    tarimasDesviadas: Number(semana.desviadas ?? semana.tarimasDesviadas ?? 0),
    tarimasRechazadas: Number(semana.rechazadas ?? semana.tarimasRechazadas ?? 0),
    tasaAprobacionReal: Number(semana.porcentajeAprobacionReal ?? semana.tasaAprobacionReal ?? 0),
    verificacionesCerradas: Number(semana.verificacionesCerradas ?? semana.totalTarimas ?? semana.tarimasTotal ?? 0),
  };
}

const cajasAfectadasValue = (item = {}) => Number(
  item.totalCajasAfectadas ?? item.cajasAfectadas ?? item.totalFamilia ?? item.veces ?? 0,
);

function CardTitle({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: BX.green900, marginBottom: 2 }}>{title}</div>
        {sub && <div style={{ fontSize: 10, color: BX.muted }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ text = 'Sin datos para el rango seleccionado' }) {
  return (
    <div style={{ height: '100%', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BX.muted, fontSize: 12 }}>
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
          border: `1px solid ${BX.border}`,
          background: open ? BX.soft : BX.card,
          color: BX.teal700,
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
          background: BX.card,
          border: `1px solid ${BX.border}`,
          borderRadius: 4,
          boxShadow: '0 8px 22px rgba(0,0,0,.14)',
          padding: '9px 10px',
          fontSize: 11,
          lineHeight: 1.45,
          color: BX.muted,
        }}>
          {text}
        </div>
      )}
    </span>
  );
}

function ChartLegend({ items, marker = 'pill' }) {
  return (
    <div className="chart-legend">
      {items.map((item) => (
        <span key={item.label} className="chart-legend-item">
          <span
            className={marker === 'dot' ? 'legend-dot' : 'legend-pill'}
            style={{ background: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function FamiliasDefectosDonut({ items, selectedFamilia, onSelectFamilia }) {
  const visibleItems = items.filter((item) => Number(item.porcentaje || 0) > 0);
  const totalCajas = visibleItems.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);

  if (!visibleItems.length) return <EmptyState />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 0.85fr) 1fr', gap: 12, alignItems: 'center' }}>
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Tooltip
            formatter={(value, name, entry) => [
              `${fmt(value)} cajas · ${fmt(entry.payload.porcentaje, 1)}%`,
              name,
            ]}
          />
          <Pie
            data={visibleItems}
            dataKey="cantidad"
            nameKey="nombre"
            cx="50%"
            cy="50%"
            innerRadius={54}
            outerRadius={82}
            paddingAngle={2}
            stroke={BX.card}
            strokeWidth={2}
            onClick={(entry) => {
              const familia = entry?.nombre ?? entry?.payload?.nombre;
              if (familia) onSelectFamilia?.(familia);
            }}
          >
            {visibleItems.map((item) => (
              <Cell
                key={item.nombre}
                fill={item.color}
                opacity={!selectedFamilia || selectedFamilia === item.nombre ? 1 : 0.35}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Pie>
          <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" style={{ fill: BX.green900, fontSize: 22, fontWeight: 800 }}>
            {fmt(totalCajas)}
          </text>
          <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" style={{ fill: BX.muted, fontSize: 10, fontWeight: 700 }}>
            cajas
          </text>
        </PieChart>
      </ResponsiveContainer>

      <div style={{ display: 'grid', gap: 8 }}>
      <ChartLegend
        marker="dot"
        items={visibleItems.map((item) => ({ label: item.nombre, color: item.color }))}
      />
        {visibleItems.map((item) => (
          <div
            key={item.nombre}
            onClick={() => onSelectFamilia?.(item.nombre)}
            style={{
              border: selectedFamilia === item.nombre ? `1px solid ${BX.teal500}` : `1px solid ${BX.border}`,
              background: selectedFamilia === item.nombre ? '#EAF5F7' : BX.card,
              borderRadius: 6,
              padding: '8px 10px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
              <strong style={{ color: BX.ink, fontSize: 11 }}>{item.nombre}</strong>
              <span style={{ color: BX.teal700, fontSize: 11, fontWeight: 800 }}>{fmt(item.porcentaje, 1)}%</span>
            </div>
            <div style={{ color: BX.muted, fontSize: 10, marginTop: 2 }}>{fmt(item.cantidad)} cajas afectadas</div>
            {item.defectos?.length ? (
              <div style={{ display: 'grid', gap: 3, marginTop: 6 }}>
                {item.defectos.slice(0, 3).map((defecto) => (
                  <div key={defecto.detalle} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: BX.muted, fontSize: 10 }}>
                    <span>{defecto.detalle}</span>
                    <strong style={{ color: BX.ink }}>{fmt(defecto.cajasAfectadas)} cajas</strong>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function TarimasAnalisisChart({ title, sub, data, loading, error, color }) {
  const rows = Array.isArray(data)
    ? data
      .map((item) => ({
        ...item,
        cantidadTarimas: Number(item.cantidadTarimas || 0),
        porcentajeDelTotal: Number(item.porcentajeDelTotal || 0),
      }))
      .sort((a, b) => b.cantidadTarimas - a.cantidadTarimas)
      .slice(0, 8)
    : EMPTY_ARRAY;
  const totalTarimas = rows.reduce((sum, item) => sum + item.cantidadTarimas, 0);
  const sliceColors = [color, BX.teal700, BX.amber, BX.blueReal, BX.teal500, BX.oliveGreen, BX.yellow, BX.navy];

  return (
    <div className="card" style={{ padding: '12px 14px' }}>
      <CardTitle title={title} sub={sub} />
      {loading ? (
        <div style={{ height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BX.muted, fontSize: 12 }}>
          Cargando analisis...
        </div>
      ) : error ? (
        <EmptyState text={error} />
      ) : rows.length ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 10, alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Tooltip
                  formatter={(value, name, entry) => [
                    `${fmt(value)} tarimas · ${fmt(entry.payload.porcentajeDelTotal, 1)}%`,
                    name,
                  ]}
                />
                <Pie
                  data={rows}
                  dataKey="cantidadTarimas"
                  nameKey="detalleDefecto"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={66}
                  paddingAngle={2}
                  stroke={BX.card}
                  strokeWidth={2}
                >
                  {rows.map((item, index) => (
                    <Cell key={item.detalleDefecto} fill={sliceColors[index % sliceColors.length]} />
                  ))}
                </Pie>
                <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" style={{ fill: BX.green900, fontSize: 20, fontWeight: 800 }}>
                  {fmt(totalTarimas)}
                </text>
                <text x="50%" y="59%" textAnchor="middle" dominantBaseline="middle" style={{ fill: BX.muted, fontSize: 9, fontWeight: 700 }}>
                  tarimas
                </text>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gap: 5 }}>
              {rows.slice(0, 5).map((item, index) => (
                <div key={item.detalleDefecto} style={{ display: 'grid', gridTemplateColumns: '10px 1fr auto', alignItems: 'center', gap: 6, color: BX.muted, fontSize: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: sliceColors[index % sliceColors.length] }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.detalleDefecto}</span>
                  <strong style={{ color: BX.ink }}>{fmt(item.cantidadTarimas)}</strong>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'none' }}>
        <ResponsiveContainer width="100%" height={0}>
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 34, left: 118, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BX.bg} horizontal={false} />
            <XAxis type="number" tick={{ fill: BX.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="detalleDefecto" width={112} tick={{ fill: BX.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value, name, entry) => [
                `${fmt(value)} tarimas · ${fmt(entry.payload.porcentajeDelTotal, 1)}%`,
                name,
              ]}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="cantidadTarimas" name="Tarimas" fill={color} radius={[0, 4, 4, 0]} barSize={16}>
              <LabelList dataKey="cantidadTarimas" position="right" formatter={(value) => fmt(value)} style={{ fill: BX.ink, fontSize: 10, fontWeight: 800 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
          </div>
        </>
      ) : <EmptyState text="Sin tarimas para los filtros seleccionados" />}
    </div>
  );
}

function DashboardInner({ accent = BX.teal700, initialDesde = defaultDesde, initialHasta = today }) {
  const [desde, setDesde] = useState(initialDesde < MIN_DASHBOARD_DATE ? MIN_DASHBOARD_DATE : initialDesde);
  const [hasta, setHasta] = useState(initialHasta);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setErrors] = useState([]);
  const [orderResult, setOrderResult] = useState(null);
  const [orderError, setOrderError] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [printCards, setPrintCards] = useState(EMPTY_ARRAY);
  const [printCardsLoading, setPrintCardsLoading] = useState(true);
  const [printCardSearch, setPrintCardSearch] = useState('');
  const [selectedPrintCard, setSelectedPrintCard] = useState(null);
  const [showPrintCardOptions, setShowPrintCardOptions] = useState(false);
  const [paretoMode, setParetoMode] = useState('frecuencia');
  const [openHelp, setOpenHelp] = useState('');
  const [cliente, setCliente] = useState('todos');
  const [tipoProceso, setTipoProceso] = useState('todos');
  const [historicoDesde, setHistoricoDesde] = useState(initialDesde < MIN_DASHBOARD_DATE ? MIN_DASHBOARD_DATE : initialDesde);
  const [historicoHasta, setHistoricoHasta] = useState(initialHasta);
  const [historicoCliente, setHistoricoCliente] = useState('todos');
  const [historicoTipoProceso, setHistoricoTipoProceso] = useState('todos');
  const [historicoMensual, setHistoricoMensual] = useState(null);
  const [historicoLoading, setHistoricoLoading] = useState(true);
  const [historicoError, setHistoricoError] = useState('');
  const [kpisGlobales, setKpisGlobales] = useState(null);
  const [defectosFamilias, setDefectosFamilias] = useState(EMPTY_ARRAY);
  const [paretoDefectos, setParetoDefectos] = useState(EMPTY_ARRAY);
  const [paretoLoading, setParetoLoading] = useState(true);
  const [paretoError, setParetoError] = useState('');
  const [familiaFiltro, setFamiliaFiltro] = useState('');
  const [estatusFiltro, setEstatusFiltro] = useState(null);
  const [tarimasRechazadasAnalisis, setTarimasRechazadasAnalisis] = useState(EMPTY_ARRAY);
  const [tarimasDesviadasAnalisis, setTarimasDesviadasAnalisis] = useState(EMPTY_ARRAY);
  const [tarimasAnalisisLoading, setTarimasAnalisisLoading] = useState(true);
  const [tarimasAnalisisErrors, setTarimasAnalisisErrors] = useState({ rechazada: '', desviada: '' });
  const [tarimasDetalle, setTarimasDetalle] = useState(EMPTY_ARRAY);
  const [semanasDesglose, setSemanasDesglose] = useState(EMPTY_ARRAY);
  const [estatusSeleccionado, setEstatusSeleccionado] = useState(null);
  const [mesActivoIndex, setMesActivoIndex] = useState(0);
  const { filtros, toggleFiltro, limpiarFiltros, hayFiltros } = useDashboardFilter();

  const load = async () => {
    setLoading(true);
    setErrors([]);
    const [analyticsResult, kpisResult] = await Promise.allSettled([
      getDashboardAnalytics({ desde, hasta, cliente, tipoProceso }),
      getKpisGlobales({ desde, hasta, cliente, tipoProceso }),
    ]);

    if (analyticsResult.status === 'fulfilled') {
      const payload = analyticsResult.value;
      setData(payload);
      setErrors(payload.errors || []);
    } else {
      setErrors([analyticsResult.reason.message]);
      setData(null);
    }

    if (kpisResult.status === 'fulfilled') {
      setKpisGlobales(kpisResult.value || null);
    } else {
      setKpisGlobales(null);
      setErrors((current) => [...current, kpisResult.reason.message]);
    }

    setLoading(false);
  };

  useEffect(() => {
    let ignore = false;

    getDashboardAnalytics({ desde, hasta, cliente, tipoProceso })
      .then((payload) => {
        if (!ignore) {
          setData(payload);
          setErrors(payload.errors || []);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setErrors([error.message]);
          setData(null);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [desde, hasta, cliente, tipoProceso]);

  useEffect(() => {
    let ignore = false;

    getKpisGlobales({ desde, hasta, cliente, tipoProceso })
      .then((payload) => {
        if (!ignore) {
          setKpisGlobales(payload || null);
        }
      })
      .catch(() => {
        if (!ignore) {
          setKpisGlobales(null);
        }
      });

    return () => {
      ignore = true;
    };
  }, [desde, hasta, cliente, tipoProceso]);

  useEffect(() => {
    let ignore = false;
    getDefectosFamilias({ desde, hasta, cliente, tipoProceso, estatusTarima: estatusFiltro })
      .then((payload) => { if (!ignore) setDefectosFamilias(Array.isArray(payload) ? payload : EMPTY_ARRAY); })
      .catch(() => { if (!ignore) setDefectosFamilias(EMPTY_ARRAY); });
    return () => { ignore = true; };
  }, [desde, hasta, cliente, tipoProceso, estatusFiltro]);

  useEffect(() => {
    setHistoricoLoading(true);
    setHistoricoError('');
    setHistoricoDesde(desde);
    setHistoricoHasta(hasta);
    setHistoricoCliente(cliente);
    setHistoricoTipoProceso(tipoProceso);
  }, [desde, hasta, cliente, tipoProceso]);

  useEffect(() => {
    setFamiliaFiltro('');
    setEstatusFiltro(null);
  }, [desde, hasta, cliente, tipoProceso]);

  useEffect(() => {
    let ignore = false;
    setParetoLoading(true);
    setParetoError('');

    getParetoDefectos({ desde, hasta, cliente, tipoProceso, familia: familiaFiltro, estatusTarima: estatusFiltro })
      .then((payload) => {
        if (!ignore) {
          setParetoDefectos(Array.isArray(payload) ? payload : EMPTY_ARRAY);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setParetoDefectos(EMPTY_ARRAY);
          setParetoError(error.message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setParetoLoading(false);
        }
      });

    return () => { ignore = true; };
  }, [desde, hasta, cliente, tipoProceso, familiaFiltro, estatusFiltro]);

  useEffect(() => {
    let ignore = false;
    setTarimasAnalisisLoading(true);
    setTarimasAnalisisErrors({ rechazada: '', desviada: '' });

    const params = { desde, hasta, cliente, tipoProceso, familia: familiaFiltro };
    Promise.allSettled([
      getTarimasAnalisis('Rechazada', params),
      getTarimasAnalisis(ESTATUS_DESVIACION, params),
    ])
      .then(([rechazadaResult, desviadaResult]) => {
        if (ignore) return;

        if (rechazadaResult.status === 'fulfilled') {
          setTarimasRechazadasAnalisis(Array.isArray(rechazadaResult.value) ? rechazadaResult.value : EMPTY_ARRAY);
        } else {
          setTarimasRechazadasAnalisis(EMPTY_ARRAY);
        }

        if (desviadaResult.status === 'fulfilled') {
          setTarimasDesviadasAnalisis(Array.isArray(desviadaResult.value) ? desviadaResult.value : EMPTY_ARRAY);
        } else {
          setTarimasDesviadasAnalisis(EMPTY_ARRAY);
        }

        setTarimasAnalisisErrors({
          rechazada: rechazadaResult.status === 'rejected' ? rechazadaResult.reason.message : '',
          desviada: desviadaResult.status === 'rejected' ? desviadaResult.reason.message : '',
        });
      })
      .finally(() => {
        if (!ignore) {
          setTarimasAnalisisLoading(false);
        }
      });

    return () => { ignore = true; };
  }, [desde, hasta, cliente, tipoProceso, familiaFiltro]);

  useEffect(() => {
    let ignore = false;
    getHistoricoMensual({
      desde: historicoDesde,
      hasta: historicoHasta,
      cliente: historicoCliente,
      tipoProceso: historicoTipoProceso,
    })
      .then((payload) => {
        if (!ignore) {
          setHistoricoMensual(payload);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setHistoricoMensual(null);
          setHistoricoError(error.message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setHistoricoLoading(false);
        }
      });
    return () => { ignore = true; };
  }, [historicoDesde, historicoHasta, historicoCliente, historicoTipoProceso]);

  useEffect(() => {
    let ignore = false;
    getPrintCards()
      .then((payload) => {
        if (!ignore) {
          setPrintCards(Array.isArray(payload) ? payload : EMPTY_ARRAY);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setPrintCards(EMPTY_ARRAY);
          setOrderError(`No se pudieron cargar los PrintCards: ${error.message}`);
        }
      })
      .finally(() => {
        if (!ignore) {
          setPrintCardsLoading(false);
        }
      });
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    let ignore = false;
    console.log('Cargando detalle interactivo...', { desde, hasta, cliente, tipoProceso });
    getDetalleInteractivo({ desde, hasta, cliente, tipoProceso })
      .then((payload) => {
        const tarimas = Array.isArray(payload) ? payload : payload?.tarimas;
        const semanas = Array.isArray(payload?.semanasDesglose) ? payload.semanasDesglose : EMPTY_ARRAY;
        console.log('Detalle interactivo recibido:', tarimas?.length || 0, 'tarimas', semanas.length, 'semanas');
        if (!ignore) {
          setTarimasDetalle(Array.isArray(tarimas) ? tarimas : EMPTY_ARRAY);
          setSemanasDesglose(semanas);
          setEstatusSeleccionado(null);
        }
      })
      .catch((err) => {
        console.error('Error detalle interactivo:', err);
        if (!ignore) {
          setTarimasDetalle(EMPTY_ARRAY);
          setSemanasDesglose(EMPTY_ARRAY);
          setEstatusSeleccionado(null);
        }
      });
    return () => { ignore = true; };
  }, [desde, hasta, cliente, tipoProceso]);

  const historicoGrafico = historicoMensual?.meses || EMPTY_ARRAY;
  const diaMeses = Array.isArray(data?.tarimasPorDiaMes)
    ? data.tarimasPorDiaMes
    : data?.tarimasPorDiaMes
      ? [data.tarimasPorDiaMes]
      : EMPTY_ARRAY;
  const mesActivoSeguro = Math.min(mesActivoIndex, Math.max(diaMeses.length - 1, 0));
  const diaMes = diaMeses[mesActivoSeguro] || EMPTY_OBJECT;
  const promedioDiarioMes = diaMes.promedioDiario ?? diaMes.promediodiariO ?? 0;

  const semanas = useMemo(() => (
    semanasDesglose.map(normalizeSemanaValidacion)
  ), [semanasDesglose]);

  const tendenciaTarimas = useMemo(() => semanas.reduce((acc, semana) => ({
    total: acc.total + Number(semana.tarimasTotal || 0),
    aprobadas: acc.aprobadas + Number(semana.tarimasAprobadas || 0),
    conHallazgos: acc.conHallazgos + Number(semana.tarimasConHallazgos || 0),
    desviadas: acc.desviadas + Number(semana.tarimasDesviadas || 0),
    rechazadas: acc.rechazadas + Number(semana.tarimasRechazadas || 0),
    verificaciones: acc.verificaciones + Number(semana.verificacionesCerradas || 0),
    cajas: acc.cajas + Number(semana.cajasRevisadas || 0),
  }), {
    total: 0,
    aprobadas: 0,
    conHallazgos: 0,
    desviadas: 0,
    rechazadas: 0,
    verificaciones: 0,
    cajas: 0,
  }), [semanas]);

  const porcentajeAprobacion = Number(kpisGlobales?.porcentajeAprobacion || 0);
  const tasaAprobacionColor = porcentajeAprobacion >= 80
    ? BX.success
    : porcentajeAprobacion >= 60
      ? BX.amber
      : BX.orange;

  const kpis = useMemo(() => {
    return [
      {
        label: 'Tarimas revisadas',
        value: fmt(kpisGlobales?.tarimasRevisadasTotales),
        sub: 'Total del periodo',
        icon: Package,
        accent,
      },
      {
        label: 'Cajas revisadas',
        value: fmt(kpisGlobales?.cajasRevisadasTotales),
        sub: 'Total del periodo',
        icon: CheckSquare,
        accent: BX.teal500,
      },
      {
        label: 'Aprobación',
        value: pct(porcentajeAprobacion),
        sub: 'Porcentaje de aprobación de tarimas',
        icon: TrendingUp,
        accent: tasaAprobacionColor,
        color: tasaAprobacionColor,
      },
      {
        label: 'Tarimas Aprobadas sin Hallazgos',
        value: fmt(kpisGlobales?.tarimasAprobadas),
        sub: 'Estatus aprobado',
        icon: CheckSquare,
        accent: ESTATUS_COLORS.Aprobada,
        color: ESTATUS_COLORS.Aprobada,
      },
      {
        label: 'Tarimas con hallazgos',
        value: fmt(kpisGlobales?.tarimasConHallazgos),
        sub: 'Tarimas con hallazgos',
        icon: Package,
        accent: ESTATUS_COLORS['Con hallazgos'],
        color: ESTATUS_COLORS['Con hallazgos'],
      },
      {
        label: 'Tarimas rechazadas',
        value: fmt(kpisGlobales?.tarimasRechazadas),
        sub: 'Tarimas rechazadas',
        icon: Package,
        accent: ESTATUS_COLORS.Rechazada,
        color: ESTATUS_COLORS.Rechazada,
      },
      {
        label: 'Tarimas desviadas',
        value: fmt(kpisGlobales?.tarimasDesviadas),
        sub: 'Tarimas desviadas',
        icon: Package,
        accent: BX.teal500,
        color: ESTATUS_COLORS[ESTATUS_DESVIACION_LEGACY],
      },
    ];
  }, [accent, kpisGlobales, porcentajeAprobacion, tasaAprobacionColor]);

  const paretoConfig = paretoMode === 'piezas'
    ? {
      barName: 'Piezas afectadas',
      sub: familiaFiltro ? `Piezas afectadas dentro de ${familiaFiltro}` : 'Piezas afectadas por defecto',
      valueField: 'piezas',
    }
    : {
      barName: 'Frecuencia en cajas',
      sub: 'Nivel caja individual · cuantas cajas tuvieron el defecto',
      valueField: 'frecuencia',
    };

  const defectosPareto = useMemo(() => {
    const rowsBase = Array.isArray(paretoDefectos) ? paretoDefectos : EMPTY_ARRAY;
    const totalFrecuencia = rowsBase.reduce((sum, item) => sum + Number(item.frecuenciaCajas || 0), 0) || 1;
    let acumuladoFrecuencia = 0;

    return rowsBase.slice(0, 8).map((item) => {
      const frecuencia = Number(item.frecuenciaCajas || 0);
      const piezas = Number(item.piezasAfectadas || 0);
      acumuladoFrecuencia += frecuencia;

      return {
        defecto: item.defecto,
        familia: item.familia,
        frecuencia,
        piezas,
        cantidad: paretoMode === 'piezas' ? piezas : frecuencia,
        acumulado: Number(((acumuladoFrecuencia / totalFrecuencia) * 100).toFixed(1)),
      };
    });
  }, [paretoDefectos, paretoMode]);

  const defectosFamilia = useMemo(() => (
    defectosFamilias.slice(0, 8).map((item, index) => ({
      nombre: item.familia,
      cantidad: cajasAfectadasValue(item),
      porcentaje: item.porcentajeFamilia,
      defectos: (item.defectos || [])
        .map((defecto) => ({
          ...defecto,
          cajasAfectadas: cajasAfectadasValue(defecto),
        }))
        .sort((a, b) => b.cajasAfectadas - a.cajasAfectadas),
      color: COLORS_PIE[index % COLORS_PIE.length],
    }))
  ), [defectosFamilias]);

  const defectosFamiliaInteractivo = defectosFamilia;
  const toggleFamiliaFiltro = (familia) => {
    setFamiliaFiltro((actual) => (actual === familia ? '' : familia));
  };
  const toggleEstatusFiltro = (estatus) => {
    setEstatusFiltro((actual) => (actual === estatus ? null : estatus));
  };
  const toggleTipoProceso = (value) => {
    setLoading(true);
    setMesActivoIndex(0);
    setTipoProceso((actual) => (actual === value ? 'todos' : value));
  };
  const toggleHistoricoTipoProceso = (value) => {
    setHistoricoLoading(true);
    setHistoricoError('');
    setHistoricoTipoProceso((actual) => (actual === value ? 'todos' : value));
  };

  const tarimasMes = historicoGrafico.map((item) => ({
    periodo: monthLabel(item),
    aprobadas: Number(item.tarimasAprobadas || 0),
    conHallazgos: Number(item.tarimasConHallazgos || 0),
    desviadas: Number(item.tarimasDesviadas || 0),
    rechazadas: Number(item.tarimasRechazadas || 0),
    sinEstatus: Number(item.tarimasSinEstatus || 0),
    total: Number(item.totalTarimas || 0),
    cajas: Number(item.cajasRevisadas || 0),
    verificaciones: Number(item.verificacionesCerradas || 0),
    tasaAprobacionReal: Number(item.tasaAprobacionReal ?? item.tasaAprobacion ?? 0),
  }));

  const diaMesResumen = useMemo(() => (diaMes.dias || []).reduce((acc, item) => ({
    aprobadas: acc.aprobadas + Number(item.tarimasAprobadas || 0),
    conHallazgos: acc.conHallazgos + Number(item.tarimasConHallazgos || 0),
    desviadas: acc.desviadas + Number(item.tarimasDesviadas || 0),
    rechazadas: acc.rechazadas + Number(item.tarimasRechazadas || 0),
    cajas: acc.cajas + Number(item.cajasRevisadas || 0),
    verificaciones: acc.verificaciones + Number(item.verificacionesCerradas || 0),
  }), {
    aprobadas: 0,
    conHallazgos: 0,
    desviadas: 0,
    rechazadas: 0,
    cajas: 0,
    verificaciones: 0,
  }), [diaMes.dias]);

  const filteredPrintCards = useMemo(() => {
    const term = printCardSearch.trim().toLowerCase();
    const rows = term
      ? printCards.filter((item) => (
        `${item.printCard || ''} ${item.lote || ''}`.toLowerCase().includes(term)
      ))
      : printCards;
    return rows.slice(0, 12);
  }, [printCardSearch, printCards]);

  const selectPrintCard = (item) => {
    setSelectedPrintCard(item);
    setPrintCardSearch(item.printCard || '');
    setOrderError('');
    setShowPrintCardOptions(false);
  };

  const buscarOrden = async (event) => {
    event.preventDefault();
    const term = printCardSearch.trim();
    if (!term) return;
    const normalizedTerm = term.toLowerCase();

    let printCard = selectedPrintCard;
    const selectedMatchesTerm = printCard
      && (
        (printCard.printCard || '').toLowerCase() === normalizedTerm
        || (printCard.lote || '').toLowerCase() === normalizedTerm
      );
    if (!selectedMatchesTerm) {
      const exactMatches = printCards.filter((item) => (
        (item.printCard || '').toLowerCase() === normalizedTerm
        || (item.lote || '').toLowerCase() === normalizedTerm
      ));
      if (exactMatches.length === 1) {
        [printCard] = exactMatches;
      } else if (exactMatches.length > 1) {
        setOrderError('Ese valor tiene varias coincidencias. Selecciona una opcion de la lista.');
        setShowPrintCardOptions(true);
        return;
      } else {
        setOrderError('Selecciona un PrintCard o lote valido de la lista.');
        setShowPrintCardOptions(true);
        return;
      }
    }

    if (!printCard?.lote) {
      setOrderError('La seleccion no tiene lote relacionado.');
      return;
    }

    setOrderLoading(true);
    setOrderError('');
    setOrderResult(null);
    setShowPrintCardOptions(false);
    try {
      setSelectedPrintCard(printCard);
      setOrderResult(await getResumenOrden(printCard.lote));
    } catch (error) {
      setOrderError(error.message);
    } finally {
      setOrderLoading(false);
    }
  };

  const estatusConfigSeleccionado = ESTATUS_VALIDACION.find((item) => item.key === estatusSeleccionado);

  const toggleEstatusValidacion = (estatus) => {
    setEstatusSeleccionado((actual) => (actual === estatus ? null : estatus));
  };

  const semanasValidacionVista = useMemo(() => {
    if (!estatusConfigSeleccionado) return semanas;

    const porSemana = new Map(semanas.map((semana) => [
      semana.semanaKey,
      {
        ...semana,
        tarimasTotal: 0,
        tarimasAprobadas: 0,
        tarimasConHallazgos: 0,
        tarimasDesviadas: 0,
        tarimasRechazadas: 0,
        verificacionesCerradas: 0,
      },
    ]));

    tarimasDetalle.forEach((tarima) => {
      if (normalizeEstatus(tarima.estatus) !== estatusSeleccionado) return;

      const semanaNumero = Number(tarima.semana || 0);
      const semanaAnio = Number(tarima.semanaAnio ?? tarima.anio ?? 0);
      const semanaKey = `${semanaAnio || 'sin-anio'}-${semanaNumero}`;
      const current = porSemana.get(semanaKey) || normalizeSemanaValidacion({
        semanaAnio,
        semana: semanaNumero,
        totalTarimas: 0,
        porcentajeAprobacionReal: 0,
      });

      porSemana.set(semanaKey, {
        ...current,
        tarimasTotal: current.tarimasTotal + 1,
        [estatusConfigSeleccionado.field]: current[estatusConfigSeleccionado.field] + 1,
        verificacionesCerradas: current.verificacionesCerradas + 1,
      });
    });

    return Array.from(porSemana.values())
      .sort((a, b) => (a.semanaAnio - b.semanaAnio) || (a.semana - b.semana));
  }, [estatusConfigSeleccionado, estatusSeleccionado, semanas, tarimasDetalle]);

  const semanasAcumulado = useMemo(() => {
    const acumulado = semanasValidacionVista.reduce((acc, semana) => {
      const real = Number(semana.acumReal ?? semana.tarimasTotal ?? 0);
      const bdgt = Number(
        semana.acumBdgt
        ?? semana.budget
        ?? semana.meta
        ?? Math.ceil(real * 1.08),
      );
      const acumReal = acc.acumReal + real;
      const acumBdgt = acc.acumBdgt + bdgt;
      return {
        acumReal,
        acumBdgt,
        rows: [...acc.rows, {
          ...semana,
          acumReal,
          acumBdgt,
        }],
      };
    }, {
      acumReal: 0,
      acumBdgt: 0,
      rows: [],
    });

    return acumulado.rows;
  }, [semanasValidacionVista]);

  const statsValidacionBase = {
    total: tendenciaTarimas.total,
    aprobadas: tendenciaTarimas.aprobadas,
    conHallazgos: tendenciaTarimas.conHallazgos,
    desviadas: tendenciaTarimas.desviadas,
    rechazadas: tendenciaTarimas.rechazadas,
    verificaciones: tendenciaTarimas.verificaciones,
  };

  const renderDiaMesCard = (id) => (
    <div id={id} className="card" style={{ padding: '12px 14px' }}>
      <CardTitle
        title="Tarimas por día del mes"
        sub={diaMes.nombreMes ? `${diaMes.nombreMes} ${diaMes.anio} · aprobadas, hallazgos, desviadas y rechazadas` : 'Mes seleccionado'}
        action={<HelpIcon text="Muestra la actividad diaria del mes seleccionado y separa las tarimas por estatus. Sirve para detectar días pico, días sin actividad y concentración de hallazgos o rechazos." open={openHelp === 'diaMes'} onToggle={() => setOpenHelp(openHelp === 'diaMes' ? '' : 'diaMes')} />}
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
        <span style={{ fontSize: 11, fontWeight: 700, color: BX.teal700, minWidth: 96, textAlign: 'center' }}>
          {diaMes.nombreMes ? `${diaMes.nombreMes} ${diaMes.anio}` : '-'}
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
        {estatusFiltro && (
          <button
            type="button"
            onClick={() => setEstatusFiltro(null)}
            style={{
              marginLeft: 4,
              border: `1px solid ${BX.teal500}`,
              background: '#EAF5F7',
              color: BX.teal700,
              borderRadius: 4,
              padding: '3px 7px',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            Filtrando defectos: {estatusFiltro} x
          </button>
        )}
      </div>
      {(diaMes.dias || []).length ? (
        <>
          <ResponsiveContainer width="100%" height={174}>
            <BarChart data={diaMes.dias} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={BX.bg} vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: BX.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: BX.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="tarimasAprobadas" name="Aprobadas" stackId="dia" fill={ESTATUS_COLORS.Aprobada} radius={[0, 0, 0, 0]} />
              <Bar dataKey="tarimasConHallazgos" name="Con hallazgos" stackId="dia" fill={ESTATUS_COLORS['Con hallazgos']} radius={[0, 0, 0, 0]} onClick={() => toggleEstatusFiltro('Con hallazgos')} style={{ cursor: 'pointer' }} />
              <Bar dataKey="tarimasDesviadas" name="Desviadas" stackId="dia" fill={ESTATUS_COLORS[ESTATUS_DESVIACION_LEGACY]} radius={[0, 0, 0, 0]} onClick={() => toggleEstatusFiltro(ESTATUS_DESVIACION)} style={{ cursor: 'pointer' }} />
              <Bar dataKey="tarimasRechazadas" name="Rechazadas" stackId="dia" fill={ESTATUS_COLORS.Rechazada} radius={[3, 3, 0, 0]} onClick={() => toggleEstatusFiltro('Rechazada')} style={{ cursor: 'pointer' }} />
            </BarChart>
          </ResponsiveContainer>
          <div className="dashboard-grid dashboard-grid-day-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
            {[
              ['Total mes', fmt(diaMes.totalMes)],
              ['Promedio diario', fmt(promedioDiarioMes, 1)],
              ['Día pico', `${diaMes.diaPico || '-'} (${fmt(diaMes.tarimasDiaPico)})`],
              ['Aprobadas', fmt(diaMesResumen.aprobadas), ESTATUS_COLORS.Aprobada],
              ['Con hallazgos', fmt(diaMesResumen.conHallazgos), ESTATUS_COLORS['Con hallazgos'], 'Con hallazgos'],
              ['Desviadas', fmt(diaMesResumen.desviadas), ESTATUS_COLORS[ESTATUS_DESVIACION_LEGACY], ESTATUS_DESVIACION],
              ['Rechazadas', fmt(diaMesResumen.rechazadas), ESTATUS_COLORS.Rechazada, 'Rechazada'],
              ['Cajas revisadas', fmt(diaMesResumen.cajas)],
              ['Verificaciones', fmt(diaMesResumen.verificaciones)],
            ].map(([label, value, color, estatus]) => (
              <div
                key={label}
                onClick={estatus ? () => toggleEstatusFiltro(estatus) : undefined}
                style={{
                  background: estatus && estatusFiltro === estatus ? '#EAF5F7' : BX.soft,
                  border: estatus && estatusFiltro === estatus ? `1px solid ${BX.teal500}` : '1px solid transparent',
                  borderRadius: 6,
                  padding: 8,
                  cursor: estatus ? 'pointer' : 'default',
                }}
              >
                <div style={{ fontSize: 10, color: BX.muted }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: color || BX.ink }}>{value}</div>
              </div>
            ))}
          </div>
        </>
      ) : <EmptyState />}
    </div>
  );

  return (
    <div className="dashboard-page" style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14, background: BX.bg, minHeight: '100%' }}>
      <div id="tour-filtros" className="card dashboard-filters" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: BX.green900 }}>
          <CalendarDays size={15} color={accent} /> Rango analítico
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: BX.muted }}>
          Desde
          <input
            className="pbi-input"
            type="date"
            min={MIN_DASHBOARD_DATE}
            value={desde}
            onChange={(event) => {
              setLoading(true);
              setMesActivoIndex(0);
              setDesde(event.target.value < MIN_DASHBOARD_DATE ? MIN_DASHBOARD_DATE : event.target.value);
            }}
            style={{ width: 140 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: BX.muted }}>
          Hasta
          <input
            className="pbi-input"
            type="date"
            min={MIN_DASHBOARD_DATE}
            value={hasta}
            onChange={(event) => {
              setLoading(true);
              setMesActivoIndex(0);
              setHasta(event.target.value);
            }}
            style={{ width: 140 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: BX.muted }}>
          Cliente
          <select
            className="pbi-select"
            value={cliente}
            onChange={(event) => {
              setLoading(true);
              setMesActivoIndex(0);
              setCliente(event.target.value);
            }}
            style={{ minWidth: 160 }}
          >
            <option value="todos">Todos</option>
            {CLIENTES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: BX.muted }}>
          Área
          {AREAS.map((item) => (
            <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: tipoProceso === item ? 800 : 600, color: tipoProceso === item ? BX.teal700 : BX.muted }}>
              <input
                type="checkbox"
                checked={tipoProceso === item}
                onChange={() => toggleTipoProceso(item)}
              />
              {item}
            </span>
          ))}
        </label>
        <button className="filter-btn" onClick={load} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} /> {loading ? 'Cargando' : 'Actualizar'}
        </button>
      </div>

      {hayFiltros && (
        <div id="tour-filtros-chip" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '8px 12px', background: '#EAF5F7', border: `1px solid ${BX.teal200}`, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: BX.teal700, fontWeight: 700 }}>Filtrando por:</span>
          {filtros.operador && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: BX.teal200, color: BX.green900, fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>
              {filtros.operador}
              <X size={11} style={{ cursor: 'pointer' }} onClick={() => toggleFiltro('operador', filtros.operador)} />
            </span>
          )}
          {filtros.turno && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: BX.teal200, color: BX.green900, fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>
              {filtros.turno}
              <X size={11} style={{ cursor: 'pointer' }} onClick={() => toggleFiltro('turno', filtros.turno)} />
            </span>
          )}
          {filtros.familiaDefecto && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: BX.teal200, color: BX.green900, fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>
              {filtros.familiaDefecto}
              <X size={11} style={{ cursor: 'pointer' }} onClick={() => toggleFiltro('familiaDefecto', filtros.familiaDefecto)} />
            </span>
          )}
          <button onClick={limpiarFiltros} style={{ marginLeft: 'auto', fontSize: 11, background: 'none', border: 'none', color: BX.teal700, cursor: 'pointer', textDecoration: 'underline' }}>
            Limpiar todo
          </button>
        </div>
      )}

      <div id="tour-kpis" className="dashboard-grid dashboard-grid-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div>
        {renderDiaMesCard('tour-validacion')}
        <div className="card" style={{ display: 'none' }}>
          <CardTitle
            title="Tarimas por día del mes"
            action={<HelpIcon text="Muestra la evolución semanal del estatus de las tarimas validadas: aprobadas, con hallazgos, desviadas y rechazadas. La línea indica la tasa de aprobación real." open={openHelp === 'validacion'} onToggle={() => setOpenHelp(openHelp === 'validacion' ? '' : 'validacion')} />}
          />
          {semanas.length ? (
            <>
              <div className="dashboard-grid dashboard-grid-validation-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, marginBottom: 8 }}>
                {[
                  ['Tarimas validadas', fmt(statsValidacionBase.total), undefined, null],
                  ['Aprobadas', fmt(statsValidacionBase.aprobadas), ESTATUS_COLORS.Aprobada, 'Aprobada'],
                  ['Con hallazgos', fmt(statsValidacionBase.conHallazgos), ESTATUS_COLORS['Con hallazgos'], 'Con hallazgos'],
                  ['Desviadas', fmt(statsValidacionBase.desviadas), ESTATUS_COLORS[ESTATUS_DESVIACION_LEGACY], ESTATUS_DESVIACION],
                  ['Rechazadas', fmt(statsValidacionBase.rechazadas), ESTATUS_COLORS.Rechazada, 'Rechazada'],
                ].map(([label, value, color, estatus]) => (
                  <div
                    key={label}
                    onClick={estatus ? () => toggleEstatusValidacion(estatus) : undefined}
                    style={{
                      background: estatus && estatusSeleccionado === estatus ? '#EAF5F7' : BX.soft,
                      border: estatus && estatusSeleccionado === estatus ? `1px solid ${BX.teal200}` : '1px solid transparent',
                      borderRadius: 4,
                      padding: '7px 8px',
                      cursor: estatus ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{ fontSize: 9, color: BX.muted }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: color || BX.ink }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                <ChartLegend
                  marker="dot"
                  items={[
                    { label: 'AcumReal', color: BX.teal700 },
                    { label: 'AcumBdgt', color: BX.teal200 },
                  ]}
                />
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <ComposedChart data={semanasAcumulado} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke={BX.bg} vertical={false} />
                  <XAxis dataKey="etiqueta" tick={{ fill: BX.teal500, fontSize: 12, fontFamily: 'Inter, Segoe UI, sans-serif' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: BX.teal500, fontSize: 12, fontFamily: 'Inter, Segoe UI, sans-serif' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="acumReal" name="AcumReal" stroke={BX.teal700} strokeWidth={2.5} dot={{ fill: BX.teal700, stroke: BX.card, strokeWidth: 2, r: 3 }} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="acumBdgt" name="AcumBdgt" stroke={BX.teal200} strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>

              <div style={{
                display: 'grid',
                gap: 5,
                marginTop: 8,
                maxHeight: semanas.length >= 3 ? 82 : 'none',
                overflowY: semanas.length >= 3 ? 'auto' : 'visible',
                paddingRight: semanas.length >= 3 ? 4 : 0,
              }}>
                {semanas.map((semana) => (
                  <div key={semana.semanaKey} className="dashboard-week-row" style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: 8, alignItems: 'center', fontSize: 10 }}>
                    <strong style={{ color: BX.green900 }}>Sem. {semana.semana}</strong>
                    <span style={{ color: BX.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fmt(semana.tarimasTotal)} tarimas · {fmt(semana.tarimasAprobadas)} aprobadas · {fmt(semana.tarimasConHallazgos)} con hallazgos · {fmt(semana.tarimasDesviadas)} desviadas · {fmt(semana.tarimasRechazadas)} rechazadas
                    </span>
                    <strong style={{ color: BX.success }}>{pct(semana.tasaAprobacionReal)}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyState />}
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-halves" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title="Histórico mensual comparativo"
            sub="Tarimas por estatus y tasa de aprobación real"
            action={<HelpIcon text="Resume mes contra mes el comportamiento de las tarimas por estatus, junto con una línea de total para ver volumen y calidad en contexto." open={openHelp === 'historico'} onToggle={() => setOpenHelp(openHelp === 'historico' ? '' : 'historico')} />}
          />
          <div className="dashboard-card-filters" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: BX.muted }}>
              Desde
              <input
                className="pbi-input"
                type="date"
                min={MIN_DASHBOARD_DATE}
                value={historicoDesde}
                onChange={(event) => {
                  setHistoricoLoading(true);
                  setHistoricoError('');
                  setHistoricoDesde(event.target.value < MIN_DASHBOARD_DATE ? MIN_DASHBOARD_DATE : event.target.value);
                }}
                style={{ width: 126, height: 28, fontSize: 10 }}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: BX.muted }}>
              Hasta
              <input
                className="pbi-input"
                type="date"
                min={MIN_DASHBOARD_DATE}
                value={historicoHasta}
                onChange={(event) => {
                  setHistoricoLoading(true);
                  setHistoricoError('');
                  setHistoricoHasta(event.target.value);
                }}
                style={{ width: 126, height: 28, fontSize: 10 }}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: BX.muted }}>
              Cliente
              <select
                className="pbi-select"
                value={historicoCliente}
                onChange={(event) => {
                  setHistoricoLoading(true);
                  setHistoricoError('');
                  setHistoricoCliente(event.target.value);
                }}
                style={{ minWidth: 128, height: 28, fontSize: 10 }}
              >
                <option value="todos">Todos</option>
                {CLIENTES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: BX.muted }}>
              Area
              {AREAS.map((item) => (
                <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: historicoTipoProceso === item ? 800 : 600, color: historicoTipoProceso === item ? BX.teal700 : BX.muted }}>
                  <input
                    type="checkbox"
                    checked={historicoTipoProceso === item}
                    onChange={() => toggleHistoricoTipoProceso(item)}
                  />
                  {item}
                </span>
              ))}
            </label>
            <span className="dashboard-filter-note" style={{ marginLeft: 'auto', fontSize: 10, color: historicoError ? BX.orange : BX.muted }}>
              {historicoLoading ? 'Cargando historico...' : historicoError || 'Filtro independiente'}
            </span>
          </div>
          {historicoLoading ? (
            <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BX.muted, fontSize: 12 }}>
              Cargando historico mensual...
            </div>
          ) : tarimasMes.length ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 4 }}>
                <ChartLegend
                  items={[
                    { label: 'Aprobadas', color: ESTATUS_COLORS.Aprobada },
                    { label: 'Con hallazgos', color: ESTATUS_COLORS['Con hallazgos'] },
                    { label: 'Desviadas', color: ESTATUS_COLORS[ESTATUS_DESVIACION_LEGACY] },
                    { label: 'Rechazadas', color: ESTATUS_COLORS.Rechazada },
                    { label: 'Tasa real', color: BX.blueReal },
                  ]}
                />
              </div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={tarimasMes} margin={{ top: 8, right: 18, left: -10, bottom: 0 }}>
                <CartesianGrid stroke={BX.bg} vertical={false} />
                <XAxis dataKey="periodo" tick={{ fill: BX.teal500, fontSize: 12, fontFamily: 'Inter, Segoe UI, sans-serif' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="tarimas" tick={{ fill: BX.teal500, fontSize: 12, fontFamily: 'Inter, Segoe UI, sans-serif' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="porcentaje" orientation="right" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: BX.teal500, fontSize: 11, fontFamily: 'Inter, Segoe UI, sans-serif' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="tarimas" dataKey="aprobadas" name="Aprobadas" stackId="estatus" fill={ESTATUS_COLORS.Aprobada} radius={[0, 0, 0, 0]} barSize={26} />
                <Bar yAxisId="tarimas" dataKey="conHallazgos" name="Con hallazgos" stackId="estatus" fill={ESTATUS_COLORS['Con hallazgos']} radius={[0, 0, 0, 0]} barSize={26} />
                <Bar yAxisId="tarimas" dataKey="desviadas" name="Desviadas" stackId="estatus" fill={ESTATUS_COLORS[ESTATUS_DESVIACION_LEGACY]} radius={[0, 0, 0, 0]} barSize={26} />
                <Bar yAxisId="tarimas" dataKey="rechazadas" name="Rechazadas" stackId="estatus" fill={ESTATUS_COLORS.Rechazada} radius={[6, 6, 0, 0]} barSize={26} />
                <Line yAxisId="porcentaje" type="monotone" dataKey="tasaAprobacionReal" name="Tasa aprobacion real" stroke={BX.blueReal} strokeWidth={2.5} dot={{ fill: BX.blueReal, stroke: BX.card, strokeWidth: 2, r: 3 }} activeDot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
            </>
          ) : <EmptyState />}
        </div>

      </div>

      <div className="dashboard-grid dashboard-grid-defectos-analisis" style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 10, alignItems: 'stretch' }}>
        <div id="tour-familias" className="card" style={{ padding: '12px 14px', minHeight: 420 }}>
          <CardTitle
            title="Familias de defectos"
            sub="Cajas afectadas por familia"
            action={<HelpIcon text="Agrupa los defectos por familia para identificar qué tipo de problema aparece con mayor frecuencia en las verificaciones." open={openHelp === 'familias'} onToggle={() => setOpenHelp(openHelp === 'familias' ? '' : 'familias')} />}
          />
          {familiaFiltro && (
            <button
              type="button"
              onClick={() => setFamiliaFiltro('')}
              style={{ border: 'none', background: 'transparent', color: BX.teal700, cursor: 'pointer', fontSize: 10, fontWeight: 800, marginBottom: 8, padding: 0, textDecoration: 'underline' }}
            >
              Limpiar familia: {familiaFiltro}
            </button>
          )}
          {defectosFamiliaInteractivo.length ? (
            <FamiliasDefectosDonut
              items={defectosFamiliaInteractivo}
              selectedFamilia={familiaFiltro}
              onSelectFamilia={toggleFamiliaFiltro}
            />
          ) : <EmptyState />}
        </div>

        <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <TarimasAnalisisChart
            title="Tarimas rechazadas"
            sub={familiaFiltro ? `Familia: ${familiaFiltro}` : 'Todos los defectos'}
            data={tarimasRechazadasAnalisis}
            loading={tarimasAnalisisLoading}
            error={tarimasAnalisisErrors.rechazada}
            color={ESTATUS_COLORS.Rechazada}
          />

          <TarimasAnalisisChart
            title="Tarimas desviadas"
            sub={familiaFiltro ? `Familia: ${familiaFiltro}` : 'Todos los defectos'}
            data={tarimasDesviadasAnalisis}
            loading={tarimasAnalisisLoading}
            error={tarimasAnalisisErrors.desviada}
            color={ESTATUS_COLORS[ESTATUS_DESVIACION_LEGACY]}
          />
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-pareto" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
        <div id="tour-pareto" className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title="Pareto de defectos"
            sub={paretoConfig.sub}
            action={(
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'inline-flex', background: BX.soft, border: `1px solid ${BX.border}`, borderRadius: 6, padding: 2, gap: 2 }}>
                  {[
                    ['frecuencia', 'Frecuencia (cajas)'],
                    ['piezas', 'Impacto (piezas)'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setParetoMode(value)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: 3,
                        background: paretoMode === value ? accent : 'transparent',
                        color: paretoMode === value ? '#fff' : BX.muted,
                        cursor: 'pointer',
                        fontSize: 10,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <HelpIcon text="Ordena los defectos de mayor a menor para identificar los problemas más relevantes. Puedes alternar entre frecuencia por caja y piezas comprometidas." open={openHelp === 'pareto'} onToggle={() => setOpenHelp(openHelp === 'pareto' ? '' : 'pareto')} />
              </div>
            )}
          />
          {paretoLoading ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BX.muted, fontSize: 12 }}>
              Cargando Pareto...
            </div>
          ) : paretoError ? (
            <EmptyState text={paretoError} />
          ) : defectosPareto.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={defectosPareto} layout="vertical" margin={{ top: 0, right: 56, left: 170, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={BX.bg} horizontal={false} />
                <XAxis xAxisId="valor" type="number" tick={{ fill: BX.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <XAxis xAxisId="porcentaje" type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="defecto" width={165} tick={{ fill: BX.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0]?.payload || {};
                    return (
                      <div className="custom-tooltip">
                        <div className="label">{label}</div>
                        <div className="item"><span>Frecuencia cajas: <strong>{fmt(row.frecuencia)}</strong></span></div>
                        <div className="item"><span>Piezas afectadas: <strong>{fmt(row.piezas)}</strong></span></div>
                        <div className="item"><span>% acumulado: <strong>{pct(row.acumulado)}</strong></span></div>
                      </div>
                    );
                  }}
                />
                <Bar xAxisId="valor" dataKey="cantidad" name={paretoConfig.barName} radius={[0, 3, 3, 0]} barSize={14}>
                  {defectosPareto.map((item, index) => (
                    <Cell key={item.defecto} fill={index < 3 ? BX.orange : BX.teal700} />
                  ))}
                  <LabelList dataKey="cantidad" position="right" formatter={(value) => fmt(value)} style={{ fill: BX.ink, fontSize: 10, fontWeight: 700 }} />
                </Bar>
                <Line xAxisId="porcentaje" dataKey="acumulado" name="% acumulado" stroke={BX.orange} strokeWidth={2} dot={{ fill: BX.orange, r: 3 }} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="card" style={{ display: 'none' }}>
          <CardTitle
            title="Tarimas por día del mes"
            sub={diaMes.nombreMes ? `${diaMes.nombreMes} ${diaMes.anio} · aprobadas, hallazgos, desviadas y rechazadas` : 'Mes seleccionado'}
            action={<HelpIcon text="Muestra la actividad diaria del mes seleccionado y separa las tarimas por estatus. Sirve para detectar días pico, días sin actividad y concentración de hallazgos o rechazos." open={openHelp === 'diaMes'} onToggle={() => setOpenHelp(openHelp === 'diaMes' ? '' : 'diaMes')} />}
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
              <span style={{ fontSize: 11, fontWeight: 700, color: BX.teal700, minWidth: 96, textAlign: 'center' }}>
                {diaMes.nombreMes ? `${diaMes.nombreMes} ${diaMes.anio}` : '-'}
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
          {(diaMes.dias || []).length ? (
            <>
              <ResponsiveContainer width="100%" height={174}>
                <BarChart data={diaMes.dias} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BX.bg} vertical={false} />
                  <XAxis dataKey="dia" tick={{ fill: BX.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: BX.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="tarimasAprobadas" name="Aprobadas" stackId="dia" fill={ESTATUS_COLORS.Aprobada} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="tarimasConHallazgos" name="Con hallazgos" stackId="dia" fill={ESTATUS_COLORS['Con hallazgos']} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="tarimasDesviadas" name="Desviadas" stackId="dia" fill={ESTATUS_COLORS['Desviación']} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="tarimasRechazadas" name="Rechazadas" stackId="dia" fill={ESTATUS_COLORS.Rechazada} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="dashboard-grid dashboard-grid-day-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                {[
                  ['Total mes', fmt(diaMes.totalMes)],
                  ['Promedio diario', fmt(promedioDiarioMes, 1)],
                  ['Día pico', `${diaMes.diaPico || '-'} (${fmt(diaMes.tarimasDiaPico)})`],
                  ['Aprobadas', fmt(diaMesResumen.aprobadas), ESTATUS_COLORS.Aprobada],
                  ['Con hallazgos', fmt(diaMesResumen.conHallazgos), ESTATUS_COLORS['Con hallazgos']],
                  ['Desviadas', fmt(diaMesResumen.desviadas), ESTATUS_COLORS['Desviación']],
                  ['Rechazadas', fmt(diaMesResumen.rechazadas), ESTATUS_COLORS.Rechazada],
                  ['Cajas revisadas', fmt(diaMesResumen.cajas)],
                  ['Verificaciones', fmt(diaMesResumen.verificaciones)],
                ].map(([label, value, color]) => (
                  <div key={label} style={{ background: BX.soft, borderRadius: 6, padding: 8 }}>
                    <div style={{ fontSize: 10, color: BX.muted }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: color || BX.ink }}>{value}</div>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyState />}
        </div>
      </div>

      <div>
        <div id="tour-printcard" className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title="Buscar PrintCard o lote"
            sub="Consulta directa por PrintCard o lote"
            action={<Users size={15} color={accent} />}
          />
          <form className="dashboard-search-form" onSubmit={buscarOrden} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} color={BX.teal500} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="pbi-input"
                placeholder={printCardsLoading ? 'Cargando PrintCards...' : 'Ej. E-5342-A_R-1 o lote'}
                value={printCardSearch}
                onChange={(event) => {
                  setPrintCardSearch(event.target.value);
                  setSelectedPrintCard(null);
                  setShowPrintCardOptions(true);
                }}
                onFocus={() => setShowPrintCardOptions(true)}
                disabled={printCardsLoading}
                style={{ paddingLeft: 28 }}
              />
              {showPrintCardOptions && !printCardsLoading && printCardSearch.trim() && (
                <div
                  style={{
                    position: 'absolute',
                    zIndex: 20,
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    maxHeight: 260,
                    overflowY: 'auto',
                    background: BX.card,
                    border: `1px solid ${BX.border}`,
                    borderRadius: 6,
                    boxShadow: '0 12px 24px rgba(29,61,58,.14)',
                  }}
                >
                  {filteredPrintCards.length ? filteredPrintCards.map((item) => (
                    <button
                      key={`${item.printCard}-${item.lote}`}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectPrintCard(item)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        padding: '8px 10px',
                        border: 'none',
                        borderBottom: `1px solid ${BX.bg}`,
                        background: BX.card,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: BX.ink }}>
                        {item.printCard}
                      </span>
                      <span style={{ fontSize: 10, color: BX.muted, whiteSpace: 'nowrap' }}>
                        Lote {item.lote}
                      </span>
                    </button>
                  )) : (
                    <div style={{ padding: '10px 12px', fontSize: 11, color: BX.muted }}>
                      Sin PrintCards o lotes coincidentes
                    </div>
                  )}
                </div>
              )}
            </div>
            <button className="filter-btn" disabled={orderLoading || printCardsLoading} style={{ background: accent, borderColor: accent, color: '#fff' }}>
              {orderLoading ? 'Buscando' : 'Buscar'}
            </button>
          </form>
          {orderError && <div style={{ background: '#FBE2D7', color: BX.orange, borderRadius: 6, padding: 8, fontSize: 11 }}>{orderError}</div>}
          {orderLoading && (
            <div style={{ background: BX.soft, borderRadius: 6, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: accent }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: BX.ink }}>Buscando orden...</div>
                <div style={{ fontSize: 10, color: BX.muted, marginTop: 2 }}>Consultando resumen de lote y tarimas</div>
              </div>
            </div>
          )}
          {!orderLoading && orderResult ? (
            <div className="dashboard-order-chip" style={{ background: BX.soft, borderRadius: 6, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: accent }}>Lote {orderResult.lote}</span>
              <span className={`badge ${orderResult.estado === 'EN PROCESO' ? 'badge-active' : 'badge-done'}`}>
                {orderResult.estado === 'EN PROCESO' ? '● En proceso' : '✓ ' + orderResult.estado}
              </span>
              {selectedPrintCard && (
                <span style={{ fontSize: 10, color: BX.muted }}>
                  {selectedPrintCard.printCard}
                </span>
              )}
              <span style={{ fontSize: 10, color: BX.muted, marginLeft: 'auto' }}>Ver detalles ↓</span>
            </div>
          ) : !orderLoading && !orderError && <EmptyState text="Ingresa un PrintCard o lote para ver su resumen" />}
        </div>
      </div>

      {orderResult && (
        <div className="card fade-in" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: accent }}>Lote {orderResult.lote}</span>
                <span className={`badge ${orderResult.estado === 'EN PROCESO' ? 'badge-active' : 'badge-done'}`}>
                  {orderResult.estado === 'EN PROCESO' ? '● En proceso' : '✓ ' + orderResult.estado}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: BX.ink }}>{orderResult.producto}</div>
              <div style={{ fontSize: 11, color: BX.muted }}>
                {orderResult.cliente}
                {orderResult.claveProducto && <span style={{ color: BX.muted }}> · Clave: {orderResult.claveProducto}</span>}
                {orderResult.muestreo && <span style={{ color: BX.muted }}> · Muestreo: {orderResult.muestreo} pzas/caja</span>}
              </div>
            </div>
            <button onClick={() => setOrderResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BX.teal500, padding: 4 }}>
              <X size={16} />
            </button>
          </div>

          <div className="dashboard-grid dashboard-grid-order-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              ['Total cajas', fmt(orderResult.totalCajas)],
              ['Total piezas', fmt(orderResult.totalPiezas)],
              ['Total tarimas', fmt(orderResult.totalTarimas)],
              ['Tarimas abiertas', fmt(orderResult.tarimasAbiertas), orderResult.tarimasAbiertas > 0 ? BX.amber : undefined],
              ['% Avance', pct(orderResult.porcentajeAvance), accent],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background: BX.soft, borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: BX.muted }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: color || BX.ink }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="dashboard-grid dashboard-grid-order-detail" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: BX.teal500, marginBottom: 8 }}>
                Defectos encontrados
              </div>
              {(orderResult.defectos || []).length ? (
                <div style={{ display: 'grid', gap: 6 }}>
                  {(orderResult.defectos || []).map((d, i) => (
                    <div key={i} style={{ border: `1px solid ${BX.border}`, borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: BX.ink }}>{d.detalle}</div>
                      <div style={{ fontSize: 10, color: BX.muted, marginTop: 2 }}>{d.familia}</div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: BX.muted, marginTop: 4 }}>
                        <span>{d.vecesPresentado} vez(ces)</span>
                        <span style={{ color: BX.orange, fontWeight: 600 }}>{fmt(d.piezasAfectadas)} pzas afectadas</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: BX.success, fontWeight: 600 }}>Sin defectos registrados</div>
              )}
              {orderResult.comentarios && (
                <div style={{ background: '#FFF3D7', borderRadius: 6, padding: '8px 10px', borderLeft: `3px solid ${BX.amber}`, marginTop: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#8A5208', marginBottom: 2 }}>Comentarios</div>
                  <div style={{ fontSize: 11, color: '#8A5208' }}>{orderResult.comentarios}</div>
                </div>
              )}
            </div>

            <div>
              {(orderResult.tarimasTerminadas || []).length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: BX.teal500, marginBottom: 8 }}>
                    Tarimas terminadas ({(orderResult.tarimasTerminadas || []).length})
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {(orderResult.tarimasTerminadas || []).map((tarima) => (
                      <div key={tarima.tarimaId} style={{ border: `1px solid ${BX.border}`, borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 12 }}>Tarima #{tarima.numeroTarima}</span>
                          <span className={`badge ${estatusCierreBadge(tarima.estatusCierre)}`}>
                            {tarima.estatusCierre}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 10, color: BX.muted, flexWrap: 'wrap' }}>
                          <span>{tarima.cajasRegistradas} cajas registradas</span>
                          <span>{tarima.usuario}</span>
                          <span>{fmtDate(tarima.fechaCierre)}</span>
                        </div>
                        {tarima.comentarioCierre && (
                          <div style={{ fontSize: 10, color: BX.muted, marginTop: 4, fontStyle: 'italic' }}>{tarima.comentarioCierre}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(orderResult.tarimasEnProceso || []).length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: BX.teal500, marginBottom: 8 }}>
                    Tarimas en proceso ({(orderResult.tarimasEnProceso || []).length})
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {(orderResult.tarimasEnProceso || []).map((tarima) => (
                      <div key={tarima.tarimaId} style={{ border: `1px solid ${BX.amber}`, borderRadius: 6, padding: '8px 10px', background: '#FFFCF0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 12 }}>Tarima #{tarima.numeroTarima}</span>
                          <span className="badge badge-active">● En proceso</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 10, color: BX.muted }}>
                          <span>{fmt(tarima.cajasLlevamos)} / {fmt(tarima.meta)} cajas</span>
                          <span>{tarima.usuarioCreo}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center', marginTop: 6 }}>
                          <div className="prog-bar-bg">
                            <div className="prog-bar-fill" style={{ width: `${Math.min((tarima.cajasLlevamos / tarima.meta) * 100, 100)}%`, background: BX.amber }} />
                          </div>
                          <span style={{ color: BX.teal700, fontSize: 10, fontWeight: 800 }}>
                            {pct(Math.min((tarima.cajasLlevamos / tarima.meta) * 100, 100))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 8px', fontSize: 10, color: BX.teal500 }}>
        <span>Bioflex · Calidad Comercial</span>
        <span>Dashboard analítico · {desde} a {hasta} · Cliente: {cliente === 'todos' ? 'Todos' : cliente} · Área: {tipoProceso === 'todos' ? 'Todas' : tipoProceso} · Base API 172.16.10.31</span>
      </div>
    </div>
  );
}

export default function Dashboard(props) {
  return (
    <DashboardFilterProvider>
      <DashboardInner {...props} />
    </DashboardFilterProvider>
  );
}
