import { useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CalendarDays, HelpCircle, RefreshCw } from 'lucide-react';
import { getTarimasPorDiaMes, getTendenciaAprobacion } from '../services/verificacionApi';

const today = new Date().toISOString().slice(0, 10);
const defaultDesde = '2026-04-01';
const CLIENTES = ['Quality', 'Destiny', 'Pollos Guerrero', 'Mr Lucky', 'Mayalatex'];
const STATUS_COLORS = {
  aprobadas: '#0078D4',
  hallazgos: '#F59E0B',
  desviadas: '#8B5CF6',
  rechazadas: '#A80000',
};

const fmt = (value, digits = 0) => Number(value || 0).toLocaleString('es-MX', {
  maximumFractionDigits: digits,
  minimumFractionDigits: digits,
});

const pct = (value) => `${fmt(value, 1)}%`;

const fmtDate = (value) => (
  value ? new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
);

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
    <div style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A19F9D', fontSize: 12 }}>
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

function WeeklyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  return (
    <div className="custom-tooltip">
      <div className="label">{label} · {fmtDate(row.inicioSemana)}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="item">
          <div className="dot" style={{ background: p.color }} />
          <span>{p.name}: <strong>{fmt(p.value)}</strong></span>
        </div>
      ))}
      <div className="item"><span>Total: <strong>{fmt(row.tarimasTotal)}</strong></span></div>
      <div className="item"><span>Tasa real: <strong>{pct(row.tasaAprobacionReal)}</strong></span></div>
    </div>
  );
}

function heatColor(total) {
  if (total <= 0) return '#F3F2F1';
  if (total <= 5) return '#FEF3C7';
  if (total <= 10) return '#F59E0B';
  return '#B45309';
}

function textColor(total) {
  return total > 10 ? '#fff' : '#252423';
}

export default function Hallazgos({ accent }) {
  const [desde, setDesde] = useState(defaultDesde);
  const [hasta, setHasta] = useState(today);
  const [cliente, setCliente] = useState('todos');
  const [tendencia, setTendencia] = useState(null);
  const [diaMes, setDiaMes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openHelp, setOpenHelp] = useState('');

  const anio = hasta ? Number(hasta.slice(0, 4)) : undefined;
  const mes = hasta ? Number(hasta.slice(5, 7)) : undefined;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [tendenciaPayload, diaMesPayload] = await Promise.all([
        getTendenciaAprobacion({ desde, hasta, cliente }),
        getTarimasPorDiaMes({ anio, mes, cliente }),
      ]);
      setTendencia(tendenciaPayload);
      setDiaMes(diaMesPayload);
    } catch (loadError) {
      setError(loadError.message);
      setTendencia(null);
      setDiaMes(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getTendenciaAprobacion({ desde, hasta, cliente }),
      getTarimasPorDiaMes({ anio, mes, cliente }),
    ])
      .then(([tendenciaPayload, diaMesPayload]) => {
        if (!ignore) {
          setTendencia(tendenciaPayload);
          setDiaMes(diaMesPayload);
        }
      })
      .catch((loadError) => {
        if (!ignore) {
          setError(loadError.message);
          setTendencia(null);
          setDiaMes(null);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, [desde, hasta, cliente, anio, mes]);

  const semanas = useMemo(() => (tendencia?.semanas || []).map((semana) => ({
    ...semana,
    etiqueta: `Sem. ${semana.semana}`,
  })), [tendencia]);

  const dias = diaMes?.dias || [];
  const calendarCells = useMemo(() => {
    const firstDate = dias[0]?.fecha ? new Date(dias[0].fecha) : null;
    const startOffset = firstDate ? firstDate.getDay() : 0;
    return [
      ...Array.from({ length: startOffset }, (_, index) => ({ empty: true, key: `empty-${index}` })),
      ...dias.map((dia) => {
        const total = Number(dia.tarimasAprobadas || 0)
          + Number(dia.tarimasConHallazgos || 0)
          + Number(dia.tarimasDesviadas || 0)
          + Number(dia.tarimasRechazadas || 0);
        return { ...dia, total, key: `day-${dia.dia}` };
      }),
    ];
  }, [dias]);

  const activeDays = dias.filter((dia) => (
    Number(dia.tarimasAprobadas || 0)
    + Number(dia.tarimasConHallazgos || 0)
    + Number(dia.tarimasDesviadas || 0)
    + Number(dia.tarimasRechazadas || 0)
  ) > 0).length;

  const promedioActivo = activeDays ? Number(diaMes?.totalMes || 0) / activeDays : 0;

  return (
    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#252423' }}>
          <CalendarDays size={15} color={accent} /> Analytics de hallazgos
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Desde
          <input className="pbi-input" type="date" value={desde} onChange={(event) => setDesde(event.target.value)} style={{ width: 140 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Hasta
          <input className="pbi-input" type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} style={{ width: 140 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#605E5C' }}>
          Cliente
          <select className="pbi-select" value={cliente} onChange={(event) => setCliente(event.target.value)} style={{ minWidth: 160 }}>
            <option value="todos">Todos</option>
            {CLIENTES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button className="filter-btn" onClick={load} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} /> {loading ? 'Cargando' : 'Actualizar'}
        </button>
      </div>

      {error && <div style={{ background: '#FDE7E9', color: '#A80000', borderRadius: 4, padding: 8, fontSize: 11 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 10 }}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title="Evolución de estatus por semana"
            sub="Aprobadas · Con hallazgos · Desviadas · Rechazadas"
            action={<HelpIcon text="Muestra cómo cambia semana a semana el estatus de las tarimas. Sirve para ver si los hallazgos, desviaciones o rechazos están aumentando aunque el volumen total también cambie." open={openHelp === 'semanal'} onToggle={() => setOpenHelp(openHelp === 'semanal' ? '' : 'semanal')} />}
          />
          {semanas.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={semanas} margin={{ top: 6, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F2F1" vertical={false} />
                <XAxis dataKey="etiqueta" tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#A19F9D', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<WeeklyTooltip />} />
                <Area type="monotone" dataKey="tarimasAprobadas" name="Aprobadas" stackId="estatus" stroke={STATUS_COLORS.aprobadas} fill={STATUS_COLORS.aprobadas} fillOpacity={0.75} />
                <Area type="monotone" dataKey="tarimasConHallazgos" name="Con hallazgos" stackId="estatus" stroke={STATUS_COLORS.hallazgos} fill={STATUS_COLORS.hallazgos} fillOpacity={0.75} />
                <Area type="monotone" dataKey="tarimasDesviadas" name="Desviadas" stackId="estatus" stroke={STATUS_COLORS.desviadas} fill={STATUS_COLORS.desviadas} fillOpacity={0.75} />
                <Area type="monotone" dataKey="tarimasRechazadas" name="Rechazadas" stackId="estatus" stroke={STATUS_COLORS.rechazadas} fill={STATUS_COLORS.rechazadas} fillOpacity={0.75} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="card" style={{ padding: '12px 14px' }}>
          <CardTitle
            title={`Actividad diaria — ${diaMes?.nombreMes || ''} ${diaMes?.anio || ''}`}
            sub="Intensidad por tarimas revisadas"
            action={<HelpIcon text="Cada celda representa un día del mes. El color se vuelve más intenso cuando hubo más tarimas revisadas, para detectar días pico, días sin actividad y concentración de hallazgos." open={openHelp === 'diaria'} onToggle={() => setOpenHelp(openHelp === 'diaria' ? '' : 'diaria')} />}
          />
          {calendarCells.length ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 5, marginBottom: 8 }}>
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
                  <div key={`${day}-${index}`} style={{ fontSize: 9, color: '#A19F9D', textAlign: 'center', fontWeight: 700 }}>{day}</div>
                ))}
                {calendarCells.map((day) => (
                  day.empty ? (
                    <div key={day.key} style={{ aspectRatio: '1', borderRadius: 4 }} />
                  ) : (
                    <div
                      key={day.key}
                      title={[
                        `Dia ${day.dia}`,
                        `Aprobadas: ${fmt(day.tarimasAprobadas)}`,
                        `Con hallazgos: ${fmt(day.tarimasConHallazgos)}`,
                        `Desviadas: ${fmt(day.tarimasDesviadas)}`,
                        `Rechazadas: ${fmt(day.tarimasRechazadas)}`,
                        `Cajas: ${fmt(day.cajasRevisadas)}`,
                      ].join('\n')}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 4,
                        background: heatColor(day.total),
                        color: textColor(day.total),
                        border: '1px solid rgba(0,0,0,.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                      }}
                    >
                      <strong style={{ fontSize: 12 }}>{day.dia}</strong>
                      <span style={{ fontSize: 9, opacity: 0.9 }}>{fmt(day.total)}</span>
                    </div>
                  )
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#605E5C', fontWeight: 600 }}>
                {fmt(diaMes?.totalMes)} tarimas · {fmt(promedioActivo, 1)} promedio por día activo · día pico {diaMes?.diaPico || '-'} con {fmt(diaMes?.tarimasDiaPico)} tarimas
              </div>
            </>
          ) : <EmptyState />}
        </div>
      </div>
    </div>
  );
}
