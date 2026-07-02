const API_BASE_URL = import.meta.env.NEXT_PUBLIC_VERIFICACION_API_BASE_URL
  || import.meta.env.VITE_VERIFICACION_API_URL
  || 'http://172.16.10.31/api/Verificacion';
const FILE_BASE_URL = API_BASE_URL.replace(/\/api\/Verificacion\/?$/i, '');

function toQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'todos') {
      query.set(key, value);
    }
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}

async function request(path, params, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}${toQuery(params)}`, options);
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = payload?.error || payload || `Error ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export function getDashboardAnalytics({ desde, hasta, cliente, tipoProceso } = {}) {
  const range = { desde, hasta, cliente, tipoProceso };
  return Promise.allSettled([
    request('/dashboard/rechazos-con-defectos', range),
    request('/dashboard/eficiencia-operadora', range),
    request('/dashboard/tarimas-por-turno', range),
    request('/dashboard/tarimas-por-dia-mes', range),
    request('/dashboard/historico-mensual', range),
  ]).then((results) => {
    const [
      rechazosConDefectos,
      eficienciaOperadora,
      tarimasPorTurno,
      tarimasPorDiaMes,
      historicoMensual,
    ] = results.map((result) => (result.status === 'fulfilled' ? result.value : null));

    const errors = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason.message);

    return {
      rechazosConDefectos,
      eficienciaOperadora,
      tarimasPorTurno,
      tarimasPorDiaMes,
      historicoMensual,
      errors,
    };
  });
}

export function getDefectosFamilias({ desde, hasta, cliente, tipoProceso, estatusTarima } = {}) {
  return request('/dashboard/defectos-familias', { desde, hasta, cliente, tipoProceso, estatusTarima });
}

export function getParetoDefectos({ desde, hasta, cliente, tipoProceso, familia, estatusTarima } = {}) {
  return request('/dashboard/pareto-defectos', { desde, hasta, cliente, tipoProceso, familia, estatusTarima });
}

export function getTarimasPorDiaMes({ desde, hasta, cliente, tipoProceso } = {}) {
  return request('/dashboard/tarimas-por-dia-mes', { desde, hasta, cliente, tipoProceso });
}

export function getHistoricoMensual({ desde, hasta, cliente, tipoProceso } = {}) {
  return request('/dashboard/historico-mensual', { desde, hasta, cliente, tipoProceso });
}

export function getKpisGlobales({ desde, hasta, cliente, tipoProceso } = {}) {
  return request('/dashboard/kpis-globales', { desde, hasta, cliente, tipoProceso });
}

export function getTarimasAnalisis(estatus, { desde, hasta, cliente, tipoProceso, familia } = {}) {
  return request(`/dashboard/tarimas-analisis/${encodeURIComponent(estatus)}`, {
    desde,
    hasta,
    cliente,
    tipoProceso,
    familia,
  });
}

export function getResumenOrden(numeroOrden) {
  return request(`/orden/${encodeURIComponent(numeroOrden)}`);
}

export function getPrintCards() {
  return request('/printcards');
}

export function getVerificacionesConFotos({ desde, hasta } = {}) {
  return request('/verificaciones-con-fotos', { desde, hasta });
}

export function getReporteEvidencias(id) {
  return request(`/reporte-evidencias/${encodeURIComponent(id)}`);
}

export function getDetalleInteractivo({ desde, hasta, cliente, tipoProceso } = {}) {
  return request('/dashboard/detalle-interactivo', { desde, hasta, cliente, tipoProceso });
}

export function postAuditoriaDefectos({ desde, hasta, familiaDefecto, cliente, familiaProducto } = {}) {
  return request('/dashboard/auditoria-defectos', undefined, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      desde,
      hasta,
      familiaDefecto: familiaDefecto || null,
      cliente: cliente && cliente !== 'todos' ? cliente : null,
      familiaProducto: familiaProducto || null,
    }),
  });
}

export function getAnalisisProductoCritico({ desde, hasta, cliente, tipoProceso } = {}) {
  return request('/dashboard/analisis-producto-critico', { desde, hasta, cliente, tipoProceso });
}

export function getIncidenciasPorOperador({ desde, hasta } = {}) {
  return request('/dashboard/incidencias-operador', { desde, hasta });
}

export function getFileUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${FILE_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
