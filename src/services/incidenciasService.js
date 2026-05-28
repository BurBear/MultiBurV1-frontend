import { apiFetch } from './api';

const endpoint = '/incidencias';

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'TODOS') {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export const listarIncidencias = (params = {}) => apiFetch(`${endpoint}${buildQuery(params)}`);
export const obtenerIncidencia = (id) => apiFetch(`${endpoint}/${id}`);
export const crearIncidencia = (payload) => apiFetch(endpoint, { method: 'POST', body: payload });
export const actualizarIncidencia = (id, payload) => apiFetch(`${endpoint}/${id}`, { method: 'PUT', body: payload });
export const actualizarEstadoIncidencia = (id, payload) => apiFetch(`${endpoint}/${id}/estado`, { method: 'PUT', body: payload });
export const cerrarIncidencia = (id, payload) => apiFetch(`${endpoint}/${id}/cerrar`, { method: 'PUT', body: payload });
export const listarHistorialIncidencia = (id) => apiFetch(`${endpoint}/${id}/historial`);
export const listarIncidenciasPorOrdenTrabajo = (ordenTrabajoId) => apiFetch(`/ordenes-trabajo/${ordenTrabajoId}/incidencias`);
export const listarIncidenciasPorOrdenProduccion = (ordenProduccionId) => apiFetch(`/ordenes-produccion/${ordenProduccionId}/incidencias`);
