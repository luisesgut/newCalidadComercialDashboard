import { useEffect, useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, Cell, CartesianGrid, ComposedChart, Line,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  CalendarDays, CheckSquare, Package, RefreshCw, Search,
  TrendingUp, Users, X,
} from 'lucide-react';
import KPICard from '../components/KPICard';
import CustomTooltip from '../components/CustomTooltip';
import { getDashboardAnalytics, getDefectosFamilias, getResumenOrden } from '../services/verificacionApi';

const COLORS_PIE = ['#0078D4', '#00B7C3', '#F2C812', '#8B5CF6', '#94A3B8'];
const today = new Date().toISOString().slice(0, 10);
const defaultDesde = '2026-04-01';
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

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

export default function Dashboard({ accent, initialDesde = defaultDesde, initialHasta = today }) {
  const [desde, setDesde] = useState(initialDesde);
  const [hasta, setHasta] = useState(initialHasta);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [order, setOrder] = useState('');
  const [orderResult, setOrderResult] = useState(null);
  const [orderError, setOrderError] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [clienteDefectos, setClienteDefectos] = useState('');
  const [defectosFamilias, setDefectosFamilias] = useState(EMPTY_ARRAY);

  const load = async () => {
    setLoading(true);
    setErrors([]);
    try {
      const payload = await getDashboardAnalytics({ desde, hasta });
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

    getDashboardAnalytics({ desde, hasta })
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
  }, [desde, hasta]);

  useEffect(() => {
    let ignore = false;
    getDefectosFamilias({ desde, hasta, cliente: clienteDefectos || undefined })
      .then((payload) => { if (!ignore) setDefectosFamilias(Array.isArray(payload) ? payload : EMPTY_ARRAY); })
      .catch(() => { if (!ignore) setDefectosFamilias(EMPTY_ARRAY); });
    return () => { ignore = true; };
  }, [desde, hasta, clienteDefectos]);

  const historico = data?.historicoMensual?.meses || EMPTY_ARRAY;
  const ultimoMes = historico[historico.length - 1] || EMPTY_OBJECT;
  const rechazos = data?.rechazosConDefectos || EMPTY_OBJECT;
  const tendencia = data?.tendenciaAprobacion || EMPTY_OBJECT;
  const turno = data?.tarimasPorTurno || EMPTY_OBJECT;
  const diaMes = data?.tarimasPorDiaMes || EMPTY_OBJECT;
  const promedioDiarioMes = diaMes.promedioDiario ?? diaMes.promediodiariO ?? 0;
  const eficiencia = data?.eficienciaOperadora?.operadoras || EMPTY_ARRAY;

  const kpis = useMemo(() => {
    const totalCajasOperadoras = eficiencia.reduce((sum, item) => sum + Number(item.totalCajas || 0), 0);
    return [
      {
        label: 'Tarimas del período',
        value: fmt(
          ultimoMes.totalTarimas !== undefined
            ? (ultimoMes.totalTarimas || 0) + (ultimoMes.tarimasSinEstatus || 0)
            : (rechazos.totalAprobadas || 0) + (rechazos.totalRechazos || 0)
        ),
        sub: `${fmt(rechazos.totalRechazos)} rechazadas · ${fmt(ultimoMes.tarimasSinEstatus)} sin estatus`,
        icon: Package,
        accent,
      },
      {
        label: 'Tasa aprobación',
        value: pct(ultimoMes.tasaAprobacion || tendencia.promedioGeneral),
        sub: `Tendencia: ${tendencia.tendencia || 'Sin datos'}`,
        icon: TrendingUp,
        accent: '#107C10',
        color: '#107C10',
      },
      {
        label: 'Cajas revisadas',
        value: fmt(ultimoMes.cajasRevisadas || totalCajasOperadoras),
        sub: `${fmt(ultimoMes.verificacionesCerradas)} verificaciones cerradas`,
        icon: CheckSquare,
        accent: '#00B7C3',
      },
    ];
  }, [accent, eficiencia, rechazos, tendencia, ultimoMes]);

  const defectosPareto = useMemo(() => {
    const rows = defectosFamilias
      .flatMap((familia) => (familia.defectos || []).map((d) => ({
        defecto: d.detalle,
        familia: familia.familia,
        cantidad: Number(d.veces || 0),
        piezasAfectadas: Number(d.piezasAfectadas || 0),
      })))
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
  }, [defectosFamilias]);

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
  }));

  const tarimasDia = (turno.porDia || []).map((item) => ({
    ...item,
    dia: dateLabel(item.fecha),
  }));

  const tarimasMes = historico.map((item) => ({
    periodo: monthLabel(item),
    aprobadas: item.tarimasAprobadas,
    rechazadas: item.tarimasRechazadas,
    total: (item.totalTarimas || 0) + (item.tarimasSinEstatus || 0),
  }));

  const buscarOrden = async (event) => {
    event.preventDefault();
    if (!order.trim()) return;
    setOrderLoading(true);
    setOrderError('');
    setOrderResult(null);
    try {
      setOrderResult(await getResumenOrden(order.trim()));
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
        <button className="filter-btn" onClick={load} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} /> {loading ? 'Cargando' : 'Actualizar'}
        </button>
        <div style={{ marginLeft: 'auto', fontSize: 10, color: errors.length ? '#A80000' : '#107C10', fontWeight: 600 }}>
          {errors.length ? `${errors.length} endpoint(s) sin respuesta` : 'API en vivo'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 10 }}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle title="Eficiencia por operador" sub="Cajas escaneadas y productividad" />
          {eficiencia.length ? (
            <ResponsiveContainer width="100%" height={Math.max(260, eficiencia.length * 36)}>
              <BarChart data={eficiencia} layout="vertical" margin={{ top: 4, right: 16, left: 136, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="usuario" width={132} tick={{ fill: '#605E5C', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalCajas" name="Cajas" radius={[0, 3, 3, 0]} barSize={22}>
                  {eficiencia.map((item) => <Cell key={item.usuario} fill={item.colorHex || '#94A3B8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle title="Tendencia de aprobación" sub={`Por semana del año · Promedio general ${pct(tendencia.promedioGeneral)}`} />
          {semanas.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={semanas} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAprobacion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#107C10" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#107C10" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
                <XAxis dataKey="etiqueta" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="tasaAprobacion" name="% Aprobación" stroke="#107C10" strokeWidth={2} fill="url(#gradAprobacion)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle title="Tarimas por turno" sub="Matutino vs vespertino por día" />
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
          <CardTitle title="Histórico mensual comparativo" sub="Tarimas aprobadas, rechazadas y total" />
          {tarimasMes.length ? (
            <ResponsiveContainer width="100%" height={210}>
              <ComposedChart data={tarimasMes} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
                <XAxis dataKey="periodo" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="aprobadas" name="Aprobadas" fill={accent} radius={[3, 3, 0, 0]} barSize={18} />
                <Bar dataKey="rechazadas" name="Rechazadas" fill="#A80000" radius={[3, 3, 0, 0]} barSize={18} />
                <Line dataKey="total" name="Total" stroke="#F2C812" strokeWidth={2} dot={{ fill: '#F2C812', r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title="Familias de defectos"
            sub="Frecuencia detectada"
            action={
              <select
                className="pbi-input"
                value={clienteDefectos}
                onChange={(e) => setClienteDefectos(e.target.value)}
                style={{ fontSize: 11, padding: '3px 8px', height: 'auto' }}
              >
                <option value="">Todos</option>
                <option value="Destiny">Destiny</option>
                <option value="Quality">Quality</option>
                <option value="Bioflex">Bioflex</option>
              </select>
            }
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
          <CardTitle title="Pareto de defectos" sub="Detalle por frecuencia y piezas afectadas" />
          {defectosPareto.length ? (
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={defectosPareto} layout="vertical" margin={{ top: 0, right: 40, left: 130, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="defecto" width={125} tick={{ fill: '#605E5C', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cantidad" name="Veces" fill={accent} radius={[0, 3, 3, 0]} barSize={14} />
                <Line dataKey="acumulado" name="% acumulado" stroke="#F2C812" strokeWidth={2} dot={{ fill: '#F2C812', r: 3 }} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle title="Tarimas por día del mes" sub={diaMes.nombreMes ? `${diaMes.nombreMes} ${diaMes.anio}` : 'Mes seleccionado'} />
          {(diaMes.dias || []).length ? (
            <>
              <ResponsiveContainer width="100%" height={174}>
                <BarChart data={diaMes.dias} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="tarimasAprobadas" name="Aprobadas" stackId="dia" fill={accent} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="tarimasRechazadas" name="Rechazadas" stackId="dia" fill="#A80000" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                {[
                  ['Total mes', fmt(diaMes.totalMes)],
                  ['Promedio diario', fmt(promedioDiarioMes, 1)],
                  ['Día pico', `${diaMes.diaPico || '-'} (${fmt(diaMes.tarimasDiaPico)})`],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#F3F2F1', borderRadius: 4, padding: 8 }}>
                    <div style={{ fontSize: 10, color: '#605E5C' }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{value}</div>
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
            title="Buscar orden"
            sub="Consulta directa por número de lote/orden"
            action={<Users size={15} color={accent} />}
          />
          <form onSubmit={buscarOrden} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} color="#A19F9D" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="pbi-input"
                placeholder="Ej. 31464"
                value={order}
                onChange={(event) => setOrder(event.target.value)}
                style={{ paddingLeft: 28 }}
              />
            </div>
            <button className="filter-btn" disabled={orderLoading} style={{ background: accent, borderColor: accent, color: '#fff' }}>
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
              <span style={{ fontSize: 10, color: '#A19F9D', marginLeft: 'auto' }}>Ver detalles ↓</span>
            </div>
          ) : !orderLoading && !orderError && <EmptyState text="Ingresa una orden para ver su resumen" />}
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
                          <span className={`badge ${tarima.estatusCierre === 'Aprobada' ? 'badge-done' : tarima.estatusCierre === 'Con hallazgos' ? 'badge-major' : 'badge-critical'}`}>
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
        <span>Dashboard analítico · {desde} a {hasta} · Base API 172.16.10.31</span>
      </div>
    </div>
  );
}
