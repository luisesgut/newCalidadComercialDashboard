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
  getPrintCards,
  getResumenOrden,
} from '../services/verificacionApi';

const COLORS_PIE = ['#0078D4', '#00B7C3', '#F2C812', '#8B5CF6', '#94A3B8'];
const today = new Date().toISOString().slice(0, 10);
const defaultDesde = '2026-04-01';
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
const CLIENTES = ['Quality', 'Destiny', 'Pollos Guerrero', 'Mr Lucky', 'Mayalatex'];
const AREAS = ['POUCH', 'BOLSEO'];
const ESTATUS_COLORS = {
  Aprobada: '#0078D4',
  'Con hallazgos': '#D29200',
  'Desviación': '#8B5CF6',
  Rechazada: '#A80000',
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
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '';
const monthLabel = (item) => item?.nombreMes ? `${item.nombreMes} ${item.anio}` : '';
const fmtDate = (val) => val ? new Date(val).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

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
    <div style={{ height: '100%', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A19F9D', fontSize: 12 }}>
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

export default function Dashboard({ accent, initialDesde = defaultDesde, initialHasta = today }) {
  const [desde, setDesde] = useState(initialDesde);
  const [hasta, setHasta] = useState(initialHasta);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
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
  const [defectosFamilias, setDefectosFamilias] = useState(EMPTY_ARRAY);

  const load = async () => {
    setLoading(true);
    setErrors([]);
    try {
      const payload = await getDashboardAnalytics({ desde, hasta, cliente, tipoProceso });
      setData(payload);
      setErrors(payload.errors || []);
    } catch (error) {
      setErrors([error.message]);
      setData(null);
    } finally {
      setLoading(false);
    }
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
    getDefectosFamilias({ desde, hasta, cliente, tipoProceso })
      .then((payload) => { if (!ignore) setDefectosFamilias(Array.isArray(payload) ? payload : EMPTY_ARRAY); })
      .catch(() => { if (!ignore) setDefectosFamilias(EMPTY_ARRAY); });
    return () => { ignore = true; };
  }, [desde, hasta, cliente, tipoProceso]);

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

  const historico = data?.historicoMensual?.meses || EMPTY_ARRAY;
  const ultimoMes = historico[historico.length - 1] || EMPTY_OBJECT;
  const rechazos = data?.rechazosConDefectos || EMPTY_OBJECT;
  const tendencia = data?.tendenciaAprobacion || EMPTY_OBJECT;
  const turno = data?.tarimasPorTurno || EMPTY_OBJECT;
  const diaMes = data?.tarimasPorDiaMes || EMPTY_OBJECT;
  const promedioDiarioMes = diaMes.promedioDiario ?? diaMes.promediodiariO ?? 0;
  const eficiencia = data?.eficienciaOperadora?.operadoras || EMPTY_ARRAY;
  const tasaAprobacionReal = ultimoMes.tasaAprobacionReal ?? tendencia.promedioGeneral;
  const tasaAprobacionColor = tasaAprobacionReal >= 80
    ? '#107C10'
    : tasaAprobacionReal >= 60
      ? '#D29200'
      : '#A80000';

  const kpis = useMemo(() => {
    const totalCajasOperadoras = eficiencia.reduce((sum, item) => sum + Number(item.totalCajas || 0), 0);
    return [
      {
        label: 'Tarimas del período',
        value: fmt(ultimoMes.totalTarimas ?? ((rechazos.totalAprobadas || 0) + (rechazos.totalRechazos || 0))),
        sub: `${fmt(ultimoMes.tarimasAprobadas)} aprobadas · ${fmt(ultimoMes.tarimasConHallazgos)} con hallazgos · ${fmt(ultimoMes.tarimasDesviadas)} desviadas · ${fmt(ultimoMes.tarimasRechazadas)} rechazadas`,
        icon: Package,
        accent,
      },
      {
        label: 'Tasa aprobación',
        value: pct(tasaAprobacionReal),
        sub: `Tendencia: ${tendencia.tendencia || 'Sin datos'}`,
        icon: TrendingUp,
        accent: tasaAprobacionColor,
        color: tasaAprobacionColor,
      },
      {
        label: 'Cajas revisadas',
        value: fmt(ultimoMes.cajasRevisadas || totalCajasOperadoras),
        sub: `${fmt(ultimoMes.verificacionesCerradas)} verificaciones cerradas`,
        icon: CheckSquare,
        accent: '#00B7C3',
      },
    ];
  }, [accent, eficiencia, rechazos, tasaAprobacionColor, tasaAprobacionReal, tendencia, ultimoMes]);

  const paretoConfig = paretoMode === 'piezas'
    ? {
      barName: 'Piezas afectadas',
      sub: 'Total de piezas comprometidas por defecto',
      valueField: 'piezasAfectadas',
    }
    : {
      barName: 'Frecuencia',
      sub: 'Nivel caja individual · cuantas cajas tuvieron el defecto',
      valueField: 'veces',
    };

  const defectosPareto = useMemo(() => {
    const rows = defectosFamilias
      .flatMap((familia) => (familia.defectos || []).map((d) => {
        const veces = Number(d.veces || 0);
        const piezasAfectadas = Number(d.piezasAfectadas || 0);
        return {
          defecto: d.detalle,
          familia: familia.familia,
          veces,
          piezasAfectadas,
          cantidad: paretoMode === 'piezas' ? piezasAfectadas : veces,
        };
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);

    const total = rows.reduce((sum, row) => sum + row.cantidad, 0) || 1;
    return rows.reduce((acc, row) => {
      const acumulado = acc.total + row.cantidad;
      return {
        total: acumulado,
        rows: [...acc.rows, { ...row, acumulado: Number(((acumulado / total) * 100).toFixed(1)) }],
      };
    }, { total: 0, rows: [] }).rows;
  }, [defectosFamilias, paretoMode]);

  const defectosFamilia = useMemo(() => (
    defectosFamilias.slice(0, 5).map((item, index) => ({
      nombre: item.familia,
      cantidad: item.totalFamilia,
      porcentaje: item.porcentajeFamilia,
      color: COLORS_PIE[index % COLORS_PIE.length],
    }))
  ), [defectosFamilias]);

  const semanas = (tendencia.semanas || []).map((semana) => ({
    ...semana,
    etiqueta: `Sem. ${semana.semana}`,
    rango: `${fmtDate(semana.inicioSemana)} - ${fmtDate(semana.finSemana)}`,
  }));

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

  const tarimasDia = (turno.porDia || []).map((item) => ({
    ...item,
    dia: dateLabel(item.fecha),
  }));

  const tarimasMes = historico.map((item) => ({
    periodo: monthLabel(item),
    aprobadas: item.tarimasAprobadas,
    conHallazgos: item.tarimasConHallazgos,
    desviadas: item.tarimasDesviadas,
    rechazadas: item.tarimasRechazadas,
    total: item.totalTarimas || 0,
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

    let printCard = selectedPrintCard;
    if (!printCard || printCard.printCard !== term) {
      const exactMatches = printCards.filter((item) => (item.printCard || '').toLowerCase() === term.toLowerCase());
      if (exactMatches.length === 1) {
        [printCard] = exactMatches;
      } else if (exactMatches.length > 1) {
        setOrderError('Ese PrintCard tiene varios lotes. Selecciona una opcion de la lista.');
        setShowPrintCardOptions(true);
        return;
      } else {
        setOrderError('Selecciona un PrintCard valido de la lista.');
        setShowPrintCardOptions(true);
        return;
      }
    }

    if (!printCard?.lote) {
      setOrderError('El PrintCard seleccionado no tiene lote relacionado.');
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

  return (
    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#252423' }}>
          <CalendarDays size={15} color={accent} /> Rango analítico
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Desde
          <input
            className="pbi-input"
            type="date"
            value={desde}
            onChange={(event) => {
              setLoading(true);
              setDesde(event.target.value);
            }}
            style={{ width: 140 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Hasta
          <input
            className="pbi-input"
            type="date"
            value={hasta}
            onChange={(event) => {
              setLoading(true);
              setHasta(event.target.value);
            }}
            style={{ width: 140 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Cliente
          <select
            className="pbi-select"
            value={cliente}
            onChange={(event) => {
              setLoading(true);
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
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Área
          <select
            className="pbi-select"
            value={tipoProceso}
            onChange={(event) => {
              setLoading(true);
              setTipoProceso(event.target.value);
            }}
            style={{ minWidth: 120 }}
          >
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

      <div style={{ background: '#FFF4CE', border: '1px solid #F2C812', borderRadius: 4, padding: '10px 12px', fontSize: 11, color: '#7A4F01', fontWeight: 600 }}>
        La funcionalidad de clicks interactivos entre gráficos está en desarrollo.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 10 }}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title="Eficiencia por operador"
            sub="Cajas escaneadas y productividad"
            action={<HelpIcon text="Compara la productividad por operador con base en las cajas escaneadas durante el rango seleccionado." open={openHelp === 'eficiencia'} onToggle={() => setOpenHelp(openHelp === 'eficiencia' ? '' : 'eficiencia')} />}
          />
          {eficiencia.length ? (
            <ResponsiveContainer width="100%" height={Math.max(260, eficiencia.length * 36)}>
              <BarChart data={eficiencia} layout="vertical" margin={{ top: 4, right: 16, left: 136, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="usuario" width={132} tick={{ fill: '#605E5C', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalCajas" name="Cajas" radius={[0, 3, 3, 0]} barSize={22}>
                  {eficiencia.map((item) => <Cell key={item.usuario} fill="#0078D4" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title="Validacion de tarimas"
            action={<HelpIcon text="Muestra la evolución semanal del estatus de las tarimas validadas: aprobadas, con hallazgos, desviadas y rechazadas. La línea indica la tasa de aprobación real." open={openHelp === 'validacion'} onToggle={() => setOpenHelp(openHelp === 'validacion' ? '' : 'validacion')} />}
          />
          {semanas.length ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, marginBottom: 8 }}>
                {[
                  ['Tarimas validadas', fmt(tendenciaTarimas.total)],
                  ['Aprobadas', fmt(tendenciaTarimas.aprobadas), ESTATUS_COLORS.Aprobada],
                  ['Con hallazgos', fmt(tendenciaTarimas.conHallazgos), ESTATUS_COLORS['Con hallazgos']],
                  ['Desviadas', fmt(tendenciaTarimas.desviadas), ESTATUS_COLORS['Desviación']],
                  ['Rechazadas', fmt(tendenciaTarimas.rechazadas), ESTATUS_COLORS.Rechazada],
                  ['Verificaciones', fmt(tendenciaTarimas.verificaciones)],
                ].map(([label, value, color]) => (
                  <div key={label} style={{ background: '#F3F2F1', borderRadius: 4, padding: '7px 8px' }}>
                    <div style={{ fontSize: 9, color: '#605E5C' }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: color || '#252423' }}>{value}</div>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={190}>
                <ComposedChart data={semanas} margin={{ top: 4, right: 0, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
                  <XAxis dataKey="etiqueta" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="tarimas" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="porcentaje" orientation="right" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar yAxisId="tarimas" dataKey="tarimasAprobadas" name="Tarimas aprobadas" stackId="tarimas" fill={ESTATUS_COLORS.Aprobada} radius={[0, 0, 0, 0]} barSize={18} />
                  <Bar yAxisId="tarimas" dataKey="tarimasConHallazgos" name="Tarimas con hallazgos" stackId="tarimas" fill={ESTATUS_COLORS['Con hallazgos']} radius={[0, 0, 0, 0]} barSize={18} />
                  <Bar yAxisId="tarimas" dataKey="tarimasDesviadas" name="Tarimas desviadas" stackId="tarimas" fill={ESTATUS_COLORS['Desviación']} radius={[0, 0, 0, 0]} barSize={18} />
                  <Bar yAxisId="tarimas" dataKey="tarimasRechazadas" name="Tarimas rechazadas" stackId="tarimas" fill={ESTATUS_COLORS.Rechazada} radius={[3, 3, 0, 0]} barSize={18} />
                  <Line yAxisId="porcentaje" type="monotone" dataKey="tasaAprobacionReal" name="% aprobacion real" stroke="#107C10" strokeWidth={2} dot={{ fill: '#107C10', r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>

              <div style={{ display: 'grid', gap: 5, marginTop: 8 }}>
                {semanas.slice(-4).map((semana) => (
                  <div key={semana.semana} style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: 8, alignItems: 'center', fontSize: 10 }}>
                    <strong style={{ color: '#252423' }}>Sem. {semana.semana}</strong>
                    <span style={{ color: '#605E5C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fmt(semana.tarimasTotal)} tarimas · {fmt(semana.tarimasAprobadas)} aprobadas · {fmt(semana.tarimasConHallazgos)} con hallazgos · {fmt(semana.tarimasRechazadas)} rechazadas
                    </span>
                    <strong style={{ color: '#107C10' }}>{pct(semana.tasaAprobacionReal)}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyState />}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title="Tarimas por turno"
            sub="Matutino vs vespertino por día"
            action={<HelpIcon text="Ayuda a comparar cuántas tarimas se trabajan por día en turno matutino y vespertino para detectar carga operativa por turno." open={openHelp === 'turno'} onToggle={() => setOpenHelp(openHelp === 'turno' ? '' : 'turno')} />}
          />
          {tarimasDia.length ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={tarimasDia} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
                <XAxis dataKey="dia" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="matutino" name="Matutino" stackId="turno" fill="#22C55E" radius={[3, 3, 0, 0]} />
                <Bar dataKey="vespertino" name="Vespertino" stackId="turno" fill="#3B82F6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {[turno.resumenMatutino, turno.resumenVespertino].filter(Boolean).map((item) => (
              <div key={item.turno} style={{ flex: 1, background: '#F3F2F1', borderRadius: 4, padding: 8 }}>
                <div style={{ fontSize: 10, color: '#605E5C' }}>{item.turno}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(item.totalTarimas)} <span style={{ fontSize: 11, color: '#A19F9D' }}>{pct(item.porcentaje)}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title="Histórico mensual comparativo"
            sub="Tarimas aprobadas, con hallazgos, desviadas, rechazadas y total"
            action={<HelpIcon text="Resume mes contra mes el comportamiento de las tarimas por estatus, junto con una línea de total para ver volumen y calidad en contexto." open={openHelp === 'historico'} onToggle={() => setOpenHelp(openHelp === 'historico' ? '' : 'historico')} />}
          />
          {tarimasMes.length ? (
            <ResponsiveContainer width="100%" height={210}>
              <ComposedChart data={tarimasMes} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
                <XAxis dataKey="periodo" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="aprobadas" name="Aprobadas" fill={ESTATUS_COLORS.Aprobada} radius={[3, 3, 0, 0]} barSize={10} />
                <Bar dataKey="conHallazgos" name="Con hallazgos" fill={ESTATUS_COLORS['Con hallazgos']} radius={[3, 3, 0, 0]} barSize={10} />
                <Bar dataKey="desviadas" name="Desviación" fill={ESTATUS_COLORS['Desviación']} radius={[3, 3, 0, 0]} barSize={10} />
                <Bar dataKey="rechazadas" name="Rechazadas" fill={ESTATUS_COLORS.Rechazada} radius={[3, 3, 0, 0]} barSize={10} />
                <Line dataKey="total" name="Total" stroke="#F2C812" strokeWidth={2} dot={{ fill: '#F2C812', r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title="Familias de defectos"
            sub="Frecuencia detectada"
            action={<HelpIcon text="Agrupa los defectos por familia para identificar qué tipo de problema aparece con mayor frecuencia en las verificaciones." open={openHelp === 'familias'} onToggle={() => setOpenHelp(openHelp === 'familias' ? '' : 'familias')} />}
          />
          {defectosFamilia.length ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 128, height: 128, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={defectosFamilia} cx="50%" cy="50%" innerRadius={36} outerRadius={58} dataKey="cantidad" strokeWidth={2} stroke="#fff">
                      {defectosFamilia.map((item) => <Cell key={item.nombre} fill={item.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1 }}>
                {defectosFamilia.map((item) => (
                  <div key={item.nombre} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: '#605E5C' }}>{item.nombre}</span>
                      <strong style={{ fontSize: 10 }}>{fmt(item.cantidad)} <span style={{ color: '#A19F9D', fontWeight: 400 }}>({fmt(item.porcentaje, 1)}%)</span></strong>
                    </div>
                    <div className="prog-bar-bg">
                      <div className="prog-bar-fill" style={{ width: `${Math.min(item.porcentaje || 0, 100)}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyState />}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title="Pareto de defectos"
            sub={paretoConfig.sub}
            action={(
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'inline-flex', background: '#F3F2F1', border: '1px solid #EDEBE9', borderRadius: 4, padding: 2, gap: 2 }}>
                  {[
                    ['frecuencia', 'Frecuencia'],
                    ['piezas', 'Piezas afectadas'],
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
                        color: paretoMode === value ? '#fff' : '#605E5C',
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
          {defectosPareto.length ? (
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={defectosPareto} layout="vertical" margin={{ top: 0, right: 40, left: 130, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="defecto" width={125} tick={{ fill: '#605E5C', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cantidad" name={paretoConfig.barName} radius={[0, 3, 3, 0]} barSize={14}>
                  {defectosPareto.map((item, index) => (
                    <Cell key={item.defecto} fill={index < 3 ? '#A80000' : accent} />
                  ))}
                  <LabelList dataKey="cantidad" position="right" formatter={(value) => fmt(value)} style={{ fill: '#252423', fontSize: 10, fontWeight: 700 }} />
                </Bar>
                <Line dataKey="acumulado" name="% acumulado" stroke="#F2C812" strokeWidth={2} dot={{ fill: '#F2C812', r: 3 }} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title="Tarimas por día del mes"
            sub={diaMes.nombreMes ? `${diaMes.nombreMes} ${diaMes.anio} · aprobadas, hallazgos, desviadas y rechazadas` : 'Mes seleccionado'}
            action={<HelpIcon text="Muestra la actividad diaria del mes seleccionado y separa las tarimas por estatus. Sirve para detectar días pico, días sin actividad y concentración de hallazgos o rechazos." open={openHelp === 'diaMes'} onToggle={() => setOpenHelp(openHelp === 'diaMes' ? '' : 'diaMes')} />}
          />
          {(diaMes.dias || []).length ? (
            <>
              <ResponsiveContainer width="100%" height={174}>
                <BarChart data={diaMes.dias} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="tarimasAprobadas" name="Aprobadas" stackId="dia" fill={ESTATUS_COLORS.Aprobada} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="tarimasConHallazgos" name="Con hallazgos" stackId="dia" fill={ESTATUS_COLORS['Con hallazgos']} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="tarimasDesviadas" name="Desviadas" stackId="dia" fill={ESTATUS_COLORS['Desviación']} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="tarimasRechazadas" name="Rechazadas" stackId="dia" fill={ESTATUS_COLORS.Rechazada} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
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
                  <div key={label} style={{ background: '#F3F2F1', borderRadius: 4, padding: 8 }}>
                    <div style={{ fontSize: 10, color: '#605E5C' }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: color || '#252423' }}>{value}</div>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyState />}
        </div>
      </div>

      <div>
        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title="Buscar PrintCard"
            sub="Consulta directa por PrintCard; el lote se resuelve automaticamente"
            action={<Users size={15} color={accent} />}
          />
          <form onSubmit={buscarOrden} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} color="#A19F9D" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="pbi-input"
                placeholder={printCardsLoading ? 'Cargando PrintCards...' : 'Ej. E-5342-A_R-1'}
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
                    background: '#fff',
                    border: '1px solid #EDEBE9',
                    borderRadius: 4,
                    boxShadow: '0 6px 18px rgba(0,0,0,.12)',
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
                        borderBottom: '1px solid #F3F2F1',
                        background: '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#252423' }}>
                        {item.printCard}
                      </span>
                      <span style={{ fontSize: 10, color: '#605E5C', whiteSpace: 'nowrap' }}>
                        Lote {item.lote}
                      </span>
                    </button>
                  )) : (
                    <div style={{ padding: '10px 12px', fontSize: 11, color: '#A19F9D' }}>
                      Sin PrintCards coincidentes
                    </div>
                  )}
                </div>
              )}
            </div>
            <button className="filter-btn" disabled={orderLoading || printCardsLoading} style={{ background: accent, borderColor: accent, color: '#fff' }}>
              {orderLoading ? 'Buscando' : 'Buscar'}
            </button>
          </form>
          {orderError && <div style={{ background: '#FDE7E9', color: '#A80000', borderRadius: 4, padding: 8, fontSize: 11 }}>{orderError}</div>}
          {orderLoading && (
            <div style={{ background: '#F3F2F1', borderRadius: 4, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: accent }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#252423' }}>Buscando orden...</div>
                <div style={{ fontSize: 10, color: '#A19F9D', marginTop: 2 }}>Consultando resumen de lote y tarimas</div>
              </div>
            </div>
          )}
          {!orderLoading && orderResult ? (
            <div style={{ background: '#F3F2F1', borderRadius: 4, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: accent }}>Lote {orderResult.lote}</span>
              <span className={`badge ${orderResult.estado === 'EN PROCESO' ? 'badge-active' : 'badge-done'}`}>
                {orderResult.estado === 'EN PROCESO' ? '● En proceso' : '✓ ' + orderResult.estado}
              </span>
              {selectedPrintCard && (
                <span style={{ fontSize: 10, color: '#605E5C' }}>
                  {selectedPrintCard.printCard}
                </span>
              )}
              <span style={{ fontSize: 10, color: '#A19F9D', marginLeft: 'auto' }}>Ver detalles ↓</span>
            </div>
          ) : !orderLoading && !orderError && <EmptyState text="Ingresa un PrintCard para ver su resumen" />}
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
              <div style={{ fontSize: 12, fontWeight: 700, color: '#252423' }}>{orderResult.producto}</div>
              <div style={{ fontSize: 11, color: '#605E5C' }}>
                {orderResult.cliente}
                {orderResult.claveProducto && <span style={{ color: '#A19F9D' }}> · Clave: {orderResult.claveProducto}</span>}
                {orderResult.muestreo && <span style={{ color: '#A19F9D' }}> · Muestreo: {orderResult.muestreo} pzas/caja</span>}
              </div>
            </div>
            <button onClick={() => setOrderResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A19F9D', padding: 4 }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              ['Total cajas', fmt(orderResult.totalCajas)],
              ['Total piezas', fmt(orderResult.totalPiezas)],
              ['Total tarimas', fmt(orderResult.totalTarimas)],
              ['Tarimas abiertas', fmt(orderResult.tarimasAbiertas), orderResult.tarimasAbiertas > 0 ? '#F2C812' : undefined],
              ['% Avance', pct(orderResult.porcentajeAvance), accent],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background: '#F3F2F1', borderRadius: 4, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: '#605E5C' }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: color || '#252423' }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#A19F9D', marginBottom: 8 }}>
                Defectos encontrados
              </div>
              {(orderResult.defectos || []).length ? (
                <div style={{ display: 'grid', gap: 6 }}>
                  {(orderResult.defectos || []).map((d, i) => (
                    <div key={i} style={{ border: '1px solid #EDEBE9', borderRadius: 4, padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#252423' }}>{d.detalle}</div>
                      <div style={{ fontSize: 10, color: '#A19F9D', marginTop: 2 }}>{d.familia}</div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#605E5C', marginTop: 4 }}>
                        <span>{d.vecesPresentado} vez(ces)</span>
                        <span style={{ color: '#A80000', fontWeight: 600 }}>{fmt(d.piezasAfectadas)} pzas afectadas</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: '#107C10', fontWeight: 600 }}>Sin defectos registrados</div>
              )}
              {orderResult.comentarios && (
                <div style={{ background: '#FFF4CE', borderRadius: 4, padding: '8px 10px', borderLeft: '3px solid #F2C812', marginTop: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#7A4F01', marginBottom: 2 }}>Comentarios</div>
                  <div style={{ fontSize: 11, color: '#7A4F01' }}>{orderResult.comentarios}</div>
                </div>
              )}
            </div>

            <div>
              {(orderResult.tarimasTerminadas || []).length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#A19F9D', marginBottom: 8 }}>
                    Tarimas terminadas ({(orderResult.tarimasTerminadas || []).length})
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {(orderResult.tarimasTerminadas || []).map((tarima) => (
                      <div key={tarima.tarimaId} style={{ border: '1px solid #EDEBE9', borderRadius: 4, padding: '8px 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 12 }}>Tarima #{tarima.numeroTarima}</span>
                          <span className={`badge ${estatusCierreBadge(tarima.estatusCierre)}`}>
                            {tarima.estatusCierre}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 10, color: '#605E5C', flexWrap: 'wrap' }}>
                          <span>{tarima.cajasRegistradas} cajas registradas</span>
                          <span>{tarima.usuario}</span>
                          <span>{fmtDate(tarima.fechaCierre)}</span>
                        </div>
                        {tarima.comentarioCierre && (
                          <div style={{ fontSize: 10, color: '#A19F9D', marginTop: 4, fontStyle: 'italic' }}>{tarima.comentarioCierre}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(orderResult.tarimasEnProceso || []).length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#A19F9D', marginBottom: 8 }}>
                    Tarimas en proceso ({(orderResult.tarimasEnProceso || []).length})
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {(orderResult.tarimasEnProceso || []).map((tarima) => (
                      <div key={tarima.tarimaId} style={{ border: '1px solid #F2C812', borderRadius: 4, padding: '8px 10px', background: '#FFFCF0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 12 }}>Tarima #{tarima.numeroTarima}</span>
                          <span className="badge badge-active">● En proceso</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 10, color: '#605E5C' }}>
                          <span>{fmt(tarima.cajasLlevamos)} / {fmt(tarima.meta)} cajas</span>
                          <span>{tarima.usuarioCreo}</span>
                        </div>
                        <div className="prog-bar-bg" style={{ marginTop: 6 }}>
                          <div className="prog-bar-fill" style={{ width: `${Math.min((tarima.cajasLlevamos / tarima.meta) * 100, 100)}%`, background: '#F2C812' }} />
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 8px', fontSize: 10, color: '#C8C6C4' }}>
        <span>Bioflex · Calidad Comercial</span>
        <span>Dashboard analítico · {desde} a {hasta} · Cliente: {cliente === 'todos' ? 'Todos' : cliente} · Área: {tipoProceso === 'todos' ? 'Todas' : tipoProceso} · Base API 172.16.10.31</span>
      </div>
    </div>
  );
}
