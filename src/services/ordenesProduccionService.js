import { apiFetch } from './api';

const endpoint = '/ordenes-produccion/';

export const listarOrdenesProduccion = () => apiFetch(endpoint);
export const obtenerOrdenProduccion = (id) => apiFetch(`/ordenes-produccion/${id}`);
export const crearOrdenProduccion = (payload) => apiFetch(endpoint, { method: 'POST', body: payload });
export const actualizarOrdenProduccion = (id, payload) => apiFetch(`/ordenes-produccion/${id}`, { method: 'PUT', body: payload });
