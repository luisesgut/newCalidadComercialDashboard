import { useMemo } from 'react';

export function useDashboardInteractivo(tarimas = [], filtros) {
  return useMemo(() => {
    let datos = tarimas;

    if (filtros.operador)
      datos = datos.filter((t) => t.operador === filtros.operador);
    if (filtros.turno)
      datos = datos.filter((t) => t.turno === filtros.turno);
    if (filtros.familiaDefecto)
      datos = datos.filter((t) => t.familiasDefecto.includes(filtros.familiaDefecto));

    const porOperador = Object.entries(
      datos.reduce((acc, t) => {
        acc[t.operador] = (acc[t.operador] || 0) + 1;
        return acc;
      }, {}),
    ).map(([operador, total]) => ({ operador, total }))
      .sort((a, b) => b.total - a.total);

    const porTurno = datos.reduce(
      (acc, t) => { acc[t.turno] = (acc[t.turno] || 0) + 1; return acc; },
      { Matutino: 0, Vespertino: 0 },
    );

    const porEstatus = datos.reduce(
      (acc, t) => { if (t.estatus) acc[t.estatus] = (acc[t.estatus] || 0) + 1; return acc; },
      {},
    );

    const famMap = {};
    datos.forEach((t) =>
      t.familiasDefecto.forEach((f) => { famMap[f] = (famMap[f] || 0) + 1; }),
    );
    const porFamilia = Object.entries(famMap)
      .map(([familia, veces]) => ({ familia, veces }))
      .sort((a, b) => b.veces - a.veces);

    const diaMap = {};
    datos.forEach((t) => {
      const dia = new Date(t.fecha).getDate();
      if (!diaMap[dia]) diaMap[dia] = { dia, Aprobada: 0, 'Con hallazgos': 0, Rechazada: 0, 'Desviación': 0 };
      if (t.estatus) diaMap[dia][t.estatus] = (diaMap[dia][t.estatus] || 0) + 1;
    });
    const porDia = Object.values(diaMap).sort((a, b) => a.dia - b.dia);

    // KPI aggregates
    const cajasRevisadas = datos.reduce((s, t) => s + Number(t.cajasRevisadas || 0), 0);
    const verificaciones = datos.length;
    const aprobadas = porEstatus['Aprobada'] || 0;
    const tasaAprobacion = datos.length
      ? Number(((aprobadas / datos.length) * 100).toFixed(1))
      : 0;

    // Weekly breakdown for validation chart
    const semanaMap = {};
    datos.forEach((t) => {
      const sem = t.semana;
      if (!sem) return;
      if (!semanaMap[sem]) semanaMap[sem] = {
        semana: sem,
        etiqueta: `Sem. ${sem}`,
        tarimasAprobadas: 0,
        tarimasConHallazgos: 0,
        tarimasDesviadas: 0,
        tarimasRechazadas: 0,
        tarimasTotal: 0,
        cajasRevisadas: 0,
        verificacionesCerradas: 0,
      };
      semanaMap[sem].tarimasTotal++;
      semanaMap[sem].cajasRevisadas += Number(t.cajasRevisadas || 0);
      semanaMap[sem].verificacionesCerradas++;
      if (t.estatus === 'Aprobada') semanaMap[sem].tarimasAprobadas++;
      else if (t.estatus === 'Con hallazgos') semanaMap[sem].tarimasConHallazgos++;
      else if (t.estatus === 'Desviación') semanaMap[sem].tarimasDesviadas++;
      else if (t.estatus === 'Rechazada') semanaMap[sem].tarimasRechazadas++;
    });
    const porSemana = Object.values(semanaMap)
      .sort((a, b) => a.semana - b.semana)
      .map((s) => ({
        ...s,
        tasaAprobacionReal: s.tarimasTotal
          ? Number(((s.tarimasAprobadas / s.tarimasTotal) * 100).toFixed(1))
          : 0,
      }));

    // Daily turno breakdown for turno chart
    const diaMapTurno = {};
    datos.forEach((t) => {
      const key = t.fecha;
      if (!diaMapTurno[key]) diaMapTurno[key] = { fecha: t.fecha, matutino: 0, vespertino: 0 };
      if (t.turno === 'Matutino') diaMapTurno[key].matutino++;
      else if (t.turno === 'Vespertino') diaMapTurno[key].vespertino++;
    });
    const porDiaTurno = Object.values(diaMapTurno).sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Turno summary cards
    const totalFiltrado = datos.length || 1;
    const resumenTurno = [
      { turno: 'Matutino', totalTarimas: porTurno.Matutino, porcentaje: (porTurno.Matutino / totalFiltrado) * 100 },
      { turno: 'Vespertino', totalTarimas: porTurno.Vespertino, porcentaje: (porTurno.Vespertino / totalFiltrado) * 100 },
    ];

    return {
      datos, porOperador, porTurno, porEstatus, porFamilia, porDia,
      cajasRevisadas, verificaciones, tasaAprobacion,
      porSemana, porDiaTurno, resumenTurno,
    };
  }, [tarimas, filtros]);
}
