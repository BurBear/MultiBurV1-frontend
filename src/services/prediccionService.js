import { apiFetch } from './api';

const endpoint = '/ia';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const predecirProceso = (payload) => (
  apiFetch(`${endpoint}/prediccion/proceso`, { method: 'POST', body: payload })
);

export const predecirOrdenProduccion = (payload) => (
  apiFetch(`${endpoint}/prediccion/orden-produccion`, { method: 'POST', body: payload })
);

export const obtenerPrediccionOrdenProduccion = (id) => (
  apiFetch(`${endpoint}/prediccion/orden-produccion/${id}`)
);

export const obtenerTendenciasProduccion = (params = {}) => (
  apiFetch(`${endpoint}/tendencias/produccion${buildQuery(params)}`)
);

export const generarPrediccionOrdenProduccion = (id) => (
  apiFetch(`${endpoint}/predicciones/orden-produccion/${id}/generar`, { method: 'POST' })
);

export const listarPredicciones = (params = {}) => (
  apiFetch(`${endpoint}/predicciones${buildQuery(params)}`)
);

export const obtenerPrediccion = (id) => (
  apiFetch(`${endpoint}/predicciones/${id}`)
);

export const obtenerPrediccionesPorOrdenProduccion = (id) => (
  apiFetch(`${endpoint}/predicciones/orden-produccion/${id}`)
);

export const compararPrediccionReal = (id) => (
  apiFetch(`${endpoint}/predicciones/${id}/comparar-real`, { method: 'PATCH' })
);
