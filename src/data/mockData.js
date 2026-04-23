export const kpiData = {
  tarimasHoy: 45, tarimasSemana: 312, tarimasMes: 1247,
  cajasHoy: 312, cajasSemana: 2180, cajasMes: 8934,
  verificacionesActivas: 12, verificacionesCerradasHoy: 8,
  verificacionesCerradasSemana: 54, verificacionesCerradasMes: 235,
  tarimasRechazadasMes: 23, tasaAprobacionTarimas: 98.2,
  tasaAprobacionCajas: 99.1, totalFotos: 1842, avgFotos: 4.3,
  promedioVerifDiario: 6.2, promedioVerifSemanal: 43.5,
};

export const costoCliente = [
  { cliente: "Destiny", total: 637365, activas: 45, cerradas: 312 },
  { cliente: "Quality", total: 270707, activas: 28, cerradas: 187 },
  { cliente: "Mr Lucky", total: 37887, activas: 8, cerradas: 47 },
];

export const tarimasMes = [
  { periodo: "Oct 25", verificadas: 198, rechazadas: 4 },
  { periodo: "Nov 25", verificadas: 245, rechazadas: 6 },
  { periodo: "Dic 25", verificadas: 287, rechazadas: 5 },
  { periodo: "Ene 26", verificadas: 265, rechazadas: 4 },
  { periodo: "Feb 26", verificadas: 252, rechazadas: 4 },
];

export const paretoDefectos = (() => {
  const raw = [
    { defecto: "Etiqueta mal colocada", cantidad: 45, pct: 28 },
    { defecto: "Sellado deficiente", cantidad: 32, pct: 20 },
    { defecto: "Empaque dañado", cantidad: 28, pct: 17 },
    { defecto: "Peso incorrecto", cantidad: 22, pct: 14 },
    { defecto: "Contaminación", cantidad: 15, pct: 9 },
    { defecto: "Fecha incorrecta", cantidad: 10, pct: 6 },
    { defecto: "Otros", cantidad: 8, pct: 5 },
  ];
  let cum = 0;
  return raw.map(d => { cum += d.pct; return { ...d, cum }; });
})();

export const familiasProductos = [
  { nombre: "Destiny", cantidad: 312, porcentaje: 42 },
  { nombre: "Quality", cantidad: 187, porcentaje: 25 },
  { nombre: "Mr Lucky", cantidad: 55, porcentaje: 7 },
  { nombre: "Otros", cantidad: 193, porcentaje: 26 },
];

export const familiasErrores = [
  { nombre: "Inocuidad", cantidad: 12, color: "#A80000" },
  { nombre: "Calidad Visual", cantidad: 45, color: "#F2C812" },
  { nombre: "Dimensiones", cantidad: 23, color: "#0078D4" },
  { nombre: "Etiquetado", cantidad: 34, color: "#8B5CF6" },
  { nombre: "Empaque", cantidad: 28, color: "#00B7C3" },
];

export const tendencia = [
  { mes: "Sep", aprobadas: 185, rechazadas: 8 },
  { mes: "Oct", aprobadas: 198, rechazadas: 4 },
  { mes: "Nov", aprobadas: 245, rechazadas: 6 },
  { mes: "Dic", aprobadas: 287, rechazadas: 5 },
  { mes: "Ene", aprobadas: 265, rechazadas: 4 },
  { mes: "Feb", aprobadas: 252, rechazadas: 4 },
];

export const verificaciones = [
  { id: 234, lote: "TAR-001234", cliente: "Destiny", producto: "Bolsa Wicket 10x15", estado: "EN PROCESO", fecha: "28/02/2026", fotos: 5, inspector: "Juan Pérez", hallazgos: 2, descripcion: "Verificación de tarima lote febrero. Se encontraron etiquetas mal colocadas en 2 cajas del nivel superior.", notas: "Requiere re-etiquetado antes de liberar." },
  { id: 233, lote: "TAR-001233", cliente: "Quality", producto: 'Film Stretch 18"', estado: "EN PROCESO", fecha: "28/02/2026", fotos: 3, inspector: "María García", hallazgos: 0, descripcion: "Verificación de rutina. Sin hallazgos hasta el momento.", notas: "" },
  { id: 232, lote: "TAR-001232", cliente: "Mr Lucky", producto: "Bolsa Ziploc 8x10", estado: "TERMINADO", fecha: "27/02/2026", fotos: 4, inspector: "Carlos López", hallazgos: 1, descripcion: "Tarima verificada y liberada con observación menor.", notas: "Sellado deficiente en 1 caja, corregido en sitio." },
  { id: 231, lote: "TAR-001231", cliente: "Destiny", producto: "Empaque Termoformado", estado: "TERMINADO", fecha: "27/02/2026", fotos: 7, inspector: "Ana Martínez", hallazgos: 3, descripcion: "Se detectaron múltiples problemas de empaque en nivel inferior.", notas: "Tarima retenida, pendiente revisión de QA." },
  { id: 230, lote: "TAR-001230", cliente: "Quality", producto: "Bolsa Wicket 12x18", estado: "EN PROCESO", fecha: "28/02/2026", fotos: 2, inspector: "Pedro Sánchez", hallazgos: 1, descripcion: "Verificación en curso. Un hallazgo menor de peso incorrecto.", notas: "" },
  { id: 229, lote: "TAR-001229", cliente: "Destiny", producto: 'Film Stretch 24"', estado: "TERMINADO", fecha: "27/02/2026", fotos: 6, inspector: "Juan Pérez", hallazgos: 0, descripcion: "Tarima aprobada sin observaciones.", notas: "" },
  { id: 228, lote: "TAR-001228", cliente: "Mr Lucky", producto: "Bolsa Ziploc 10x12", estado: "TERMINADO", fecha: "26/02/2026", fotos: 4, inspector: "María García", hallazgos: 2, descripcion: "Dos cajas con etiquetas dañadas. Corregidas antes de liberar.", notas: "Se notificó al operador de línea." },
  { id: 227, lote: "TAR-001227", cliente: "Quality", producto: "Empaque Termoformado L", estado: "TERMINADO", fecha: "26/02/2026", fotos: 3, inspector: "Carlos López", hallazgos: 0, descripcion: "Verificación completa sin hallazgos.", notas: "" },
  { id: 226, lote: "TAR-001226", cliente: "Destiny", producto: "Bolsa Wicket 8x12", estado: "TERMINADO", fecha: "25/02/2026", fotos: 5, inspector: "Ana Martínez", hallazgos: 1, descripcion: "Peso ligeramente fuera de especificación en muestras aleatorias.", notas: "Calibración de báscula programada." },
  { id: 225, lote: "TAR-001225", cliente: "Quality", producto: "Film Stretch 20\"", estado: "TERMINADO", fecha: "25/02/2026", fotos: 4, inspector: "Pedro Sánchez", hallazgos: 0, descripcion: "Tarima liberada sin observaciones.", notas: "" },
  { id: 224, lote: "TAR-001224", cliente: "Mr Lucky", producto: "Bolsa Ziploc 6x8", estado: "TERMINADO", fecha: "24/02/2026", fotos: 3, inspector: "Juan Pérez", hallazgos: 1, descripcion: "Fecha de impresión incorrecta detectada.", notas: "Lote reimpreso y re-verificado." },
  { id: 223, lote: "TAR-001223", cliente: "Destiny", producto: "Empaque Termoformado S", estado: "TERMINADO", fecha: "24/02/2026", fotos: 6, inspector: "María García", hallazgos: 0, descripcion: "Sin observaciones.", notas: "" },
];

export const hallazgos = [
  { id: "H-0089", verificacion: 234, lote: "TAR-001234", cliente: "Destiny", tipo: "Etiquetado", severidad: "MAYOR", descripcion: "Etiqueta mal colocada en zona de código de barras", estado: "ABIERTO", fecha: "28/02/2026", inspector: "Juan Pérez", accion: "Re-etiquetado solicitado al operador" },
  { id: "H-0088", verificacion: 234, lote: "TAR-001234", cliente: "Destiny", tipo: "Empaque", severidad: "MENOR", descripcion: "Leve deformación en ángulo superior de caja #7", estado: "ABIERTO", fecha: "28/02/2026", inspector: "Juan Pérez", accion: "Monitoreo en próxima verificación" },
  { id: "H-0087", verificacion: 232, lote: "TAR-001232", cliente: "Mr Lucky", tipo: "Calidad Visual", severidad: "MENOR", descripcion: "Sellado deficiente en una caja del nivel 3", estado: "CERRADO", fecha: "27/02/2026", inspector: "Carlos López", accion: "Corregido en sitio" },
  { id: "H-0086", verificacion: 231, lote: "TAR-001231", cliente: "Destiny", tipo: "Inocuidad", severidad: "CRÍTICO", descripcion: "Posible contaminación cruzada en nivel inferior", estado: "ABIERTO", fecha: "27/02/2026", inspector: "Ana Martínez", accion: "Tarima retenida, revisión de QA en curso" },
  { id: "H-0085", verificacion: 231, lote: "TAR-001231", cliente: "Destiny", tipo: "Empaque", severidad: "MAYOR", descripcion: "Empaque dañado en 3 unidades nivel inferior", estado: "ABIERTO", fecha: "27/02/2026", inspector: "Ana Martínez", accion: "Pendiente aprobación de disposición" },
  { id: "H-0084", verificacion: 231, lote: "TAR-001231", cliente: "Destiny", tipo: "Dimensiones", severidad: "MENOR", descripcion: "Altura de tarima 2cm por encima de especificación", estado: "CERRADO", fecha: "27/02/2026", inspector: "Ana Martínez", accion: "Ajustado y aceptado por cliente" },
  { id: "H-0083", verificacion: 230, lote: "TAR-001230", cliente: "Quality", tipo: "Dimensiones", severidad: "MENOR", descripcion: "Peso promedio 1.2% por debajo del nominal", estado: "ABIERTO", fecha: "28/02/2026", inspector: "Pedro Sánchez", accion: "Calibración de línea solicitada" },
  { id: "H-0082", verificacion: 228, lote: "TAR-001228", cliente: "Mr Lucky", tipo: "Etiquetado", severidad: "MAYOR", descripcion: "Etiqueta de lote ilegible por mala impresión", estado: "CERRADO", fecha: "26/02/2026", inspector: "María García", accion: "Re-impresión ejecutada" },
  { id: "H-0081", verificacion: 228, lote: "TAR-001228", cliente: "Mr Lucky", tipo: "Calidad Visual", severidad: "MENOR", descripcion: "Manchas de tinta en 2 cajas exteriores", estado: "CERRADO", fecha: "26/02/2026", inspector: "María García", accion: "Cajas reemplazadas" },
  { id: "H-0080", verificacion: 226, lote: "TAR-001226", cliente: "Destiny", tipo: "Dimensiones", severidad: "MENOR", descripcion: "Peso de muestra #4 fuera de tolerancia ±2%", estado: "CERRADO", fecha: "25/02/2026", inspector: "Ana Martínez", accion: "Báscula calibrada y muestreo repetido" },
  { id: "H-0079", verificacion: 224, lote: "TAR-001224", cliente: "Mr Lucky", tipo: "Etiquetado", severidad: "MAYOR", descripcion: "Fecha de vencimiento incorrecta impresa", estado: "CERRADO", fecha: "24/02/2026", inspector: "Juan Pérez", accion: "Lote reimpreso completamente" },
];

export const reportesData = {
  resumenMensual: [
    { mes: "Sep 25", tarimas: 193, cajas: 1342, hallazgos: 18, aprobacion: 97.2 },
    { mes: "Oct 25", tarimas: 202, cajas: 1408, hallazgos: 12, aprobacion: 98.1 },
    { mes: "Nov 25", tarimas: 251, cajas: 1751, hallazgos: 15, aprobacion: 97.8 },
    { mes: "Dic 25", tarimas: 292, cajas: 2038, hallazgos: 9, aprobacion: 98.7 },
    { mes: "Ene 26", tarimas: 269, cajas: 1879, hallazgos: 10, aprobacion: 98.5 },
    { mes: "Feb 26", tarimas: 256, cajas: 1788, hallazgos: 11, aprobacion: 98.2 },
  ],
  porCliente: [
    { cliente: "Destiny", tarimas: 537, cajas: 3748, hallazgos: 28, aprobacion: 97.9 },
    { cliente: "Quality", tarimas: 389, cajas: 2717, hallazgos: 18, aprobacion: 98.7 },
    { cliente: "Mr Lucky", tarimas: 110, cajas: 770, hallazgos: 9, aprobacion: 98.0 },
    { cliente: "Otros", tarimas: 211, cajas: 1473, hallazgos: 20, aprobacion: 97.4 },
  ],
  inspectores: [
    { nombre: "Juan Pérez", verificaciones: 68, hallazgos: 14, promDias: 1.2, tasa: 98.3 },
    { nombre: "María García", verificaciones: 61, hallazgos: 10, promDias: 1.1, tasa: 98.9 },
    { nombre: "Carlos López", verificaciones: 55, hallazgos: 8, promDias: 1.3, tasa: 99.1 },
    { nombre: "Ana Martínez", verificaciones: 58, hallazgos: 16, promDias: 1.0, tasa: 97.8 },
    { nombre: "Pedro Sánchez", verificaciones: 47, hallazgos: 11, promDias: 1.4, tasa: 98.1 },
  ],
};

export const COLORS_PIE = ["#0078D4", "#00B7C3", "#F2C812", "#A19F9D"];
export const COLORS_ERR = ["#A80000", "#F2C812", "#0078D4", "#8B5CF6", "#00B7C3"];
