const API_BASE_URL = import.meta.env.NEXT_PUBLIC_VERIFICACION_API_BASE_URL
  || import.meta.env.VITE_VERIFICACION_API_URL
  || 'http://172.16.10.31/api/Verificacion';
const FILE_BASE_URL = API_BASE_URL.replace(/\/api\/Verificacion\/?$/i, '');

function toQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}

async function request(path, params) {
  const response = await fetch(`${API_BASE_URL}${path}${toQuery(params)}`);
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

export function getDashboardAnalytics({ desde, hasta } = {}) {
  const range = { desde, hasta };
  return Promise.allSettled([
    request('/dashboard/defectos-por-producto', range),
    request('/dashboard/rechazos-con-defectos', range),
    request('/dashboard/eficiencia-operadora', range),
    request('/dashboard/tendencia-aprobacion', range),
    request('/dashboard-global-filtrado', range),
    request('/dashboard/tarimas-por-turno', range),
    request('/dashboard/tarimas-por-dia-mes', {
      anio: desde ? Number(desde.slice(0, 4)) : undefined,
      mes: desde ? Number(desde.slice(5, 7)) : undefined,
    }),
    request('/dashboard/historico-mensual', range),
  ]).then((results) => {
    const [
      defectosPorProducto,
      rechazosConDefectos,
      eficienciaOperadora,
      tendenciaAprobacion,
      dashboardGlobal,
      tarimasPorTurno,
      tarimasPorDiaMes,
      historicoMensual,
    ] = results.map((result) => (result.status === 'fulfilled' ? result.value : null));

    const errors = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason.message);

    return {
      defectosPorProducto,
      rechazosConDefectos,
      eficienciaOperadora,
      tendenciaAprobacion,
      dashboardGlobal,
      tarimasPorTurno,
      tarimasPorDiaMes,
      historicoMensual,
      errors,
    };
  });
}

export function getDefectosFamilias({ desde, hasta, cliente } = {}) {
  return request('/dashboard/defectos-familias', { desde, hasta, cliente: cliente || undefined });
}

export function getResumenOrden(numeroOrden) {
  return request(`/orden/${encodeURIComponent(numeroOrden)}`);
}

export function getVerificacionesConFotos({ desde, hasta } = {}) {
  return request('/verificaciones-con-fotos', { desde, hasta });
}

export function getReporteEvidencias(id) {
  return request(`/reporte-evidencias/${encodeURIComponent(id)}`);
}

export function getFileUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${FILE_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
