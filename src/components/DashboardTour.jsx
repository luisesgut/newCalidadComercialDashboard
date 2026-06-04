import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const PASOS = [
  {
    target: null,
    title: 'Bienvenido al Dashboard de Calidad Comercial',
    content: 'Este recorrido te muestra cómo navegar los gráficos, aplicar filtros interactivos y consultar órdenes de producción. Toma menos de 2 minutos.',
  },
  {
    target: '#tour-filtros',
    title: 'Rango y filtros globales',
    content: 'Controla el período de análisis, el cliente y el área (POUCH / BOLSEO). Todos los gráficos se actualizan al cambiar estas opciones. Usa "Actualizar" para forzar recarga manual.',
  },
  {
    target: '#tour-kpis',
    title: 'Indicadores clave (KPIs)',
    content: 'Las tres tarjetas muestran el total de tarimas, la tasa de aprobación y las cajas revisadas del período. Cuando activas un filtro interactivo estos números cambian en tiempo real.',
  },
  {
    target: '#tour-eficiencia',
    title: 'Filtro por operador',
    content: 'Haz click en una barra azul para filtrar todo el dashboard por ese operador. Las demás barras se atenúan y aparece un chip en la barra superior. Vuelve a hacer click para quitar el filtro.',
  },
  {
    target: '#tour-turno',
    title: 'Filtro por turno',
    content: 'Las tarjetas "Matutino" y "Vespertino" de abajo de la gráfica son clickeables. Al seleccionar una se pone azul y filtra todo el dashboard. Haz click de nuevo para desactivar.',
  },
  {
    target: '#tour-validacion',
    title: 'Validación semanal de tarimas',
    content: 'Muestra semana a semana las tarimas aprobadas, con hallazgos, desviadas y rechazadas. Cuando hay un filtro activo la gráfica y los contadores se actualizan para reflejar solo la selección.',
  },
  {
    target: '#tour-familias',
    title: 'Filtro por familia de defecto',
    content: 'Haz click en un segmento del donut para filtrar por ese tipo de defecto. Los demás segmentos se atenúan y el dashboard muestra solo las tarimas con ese defecto.',
  },
  {
    target: '#tour-pareto',
    title: 'Pareto de defectos',
    content: 'Ordena los defectos de mayor a menor frecuencia. Los 3 primeros (en rojo) son los más críticos. Alterna entre "Frecuencia" (cajas afectadas) y "Piezas afectadas" con los botones de arriba.',
  },
  {
    target: '#tour-printcard',
    title: 'Consulta por PrintCard',
    content: 'Escribe o selecciona un PrintCard para ver el resumen completo de esa orden: avance, tarimas terminadas, tarimas en proceso y defectos encontrados.',
  },
];

function calcPosTooltip(rect, winW, winH) {
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  const TOOLTIP_H = 180;
  const TOOLTIP_W = 340;
  const GAP = 16;

  let top;
  let left;

  if (rect.bottom + GAP + TOOLTIP_H < winH) {
    top = rect.bottom + GAP;
  } else {
    top = Math.max(8, rect.top - GAP - TOOLTIP_H);
  }

  left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
  left = Math.max(8, Math.min(left, winW - TOOLTIP_W - 8));

  return { top, left };
}

export default function DashboardTour({ run, onFinish }) {
  const [paso, setPaso] = useState(0);
  const [rect, setRect] = useState(null);
  const [winSize, setWinSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    if (!run) { setPaso(0); return; }
    const target = PASOS[paso].target;
    if (target) {
      const el = document.querySelector(target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          setRect(el.getBoundingClientRect());
          setWinSize({ w: window.innerWidth, h: window.innerHeight });
        }, 350);
      } else {
        setRect(null);
      }
    } else {
      setRect(null);
    }
  }, [run, paso]);

  useEffect(() => {
    const onResize = () => setWinSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!run) return null;

  const pasoActual = PASOS[paso];
  const total = PASOS.length;
  const esUltimo = paso === total - 1;

  const avanzar = () => (esUltimo ? onFinish() : setPaso((p) => p + 1));
  const retroceder = () => setPaso((p) => p - 1);

  const pos = calcPosTooltip(rect, winSize.w, winSize.h);

  return (
    <>
      {/* Overlay oscuro */}
      <div
        onClick={onFinish}
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: rect ? 'transparent' : 'rgba(0,0,0,0.45)',
          pointerEvents: 'all',
        }}
      />

      {/* Spotlight sobre el elemento */}
      {rect && (
        <div style={{
          position: 'fixed',
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
          borderRadius: 6,
          zIndex: 999,
          pointerEvents: 'none',
          outline: '2px solid #0078D4',
        }} />
      )}

      {/* Tooltip */}
      <div style={{
        position: 'fixed',
        zIndex: 1000,
        width: 340,
        background: '#fff',
        borderRadius: 6,
        boxShadow: '0 8px 28px rgba(0,0,0,.22)',
        padding: '14px 16px',
        ...pos,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: '#A19F9D', fontWeight: 600 }}>
            Paso {paso + 1} de {total}
          </span>
          <button onClick={onFinish} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A19F9D', padding: 0, lineHeight: 1 }}>
            <X size={14} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: '#F3F2F1', borderRadius: 2, marginBottom: 10 }}>
          <div style={{ height: 3, background: '#0078D4', borderRadius: 2, width: `${((paso + 1) / total) * 100}%`, transition: 'width .25s' }} />
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#252423', marginBottom: 6 }}>{pasoActual.title}</div>
        <div style={{ fontSize: 12, color: '#605E5C', lineHeight: 1.55, marginBottom: 14 }}>{pasoActual.content}</div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={onFinish}
            style={{ fontSize: 11, color: '#A19F9D', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Saltar recorrido
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            {paso > 0 && (
              <button onClick={retroceder} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#605E5C', background: '#F3F2F1', border: 'none', borderRadius: 4, padding: '5px 10px', cursor: 'pointer' }}>
                <ChevronLeft size={12} /> Anterior
              </button>
            )}
            <button onClick={avanzar} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#fff', background: '#0078D4', border: 'none', borderRadius: 4, padding: '5px 14px', cursor: 'pointer' }}>
              {esUltimo ? 'Finalizar' : 'Siguiente'} {!esUltimo && <ChevronRight size={12} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
