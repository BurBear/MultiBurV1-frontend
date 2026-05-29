import { apiFetch } from './api';

const endpoint = '/ordenes-trabajo/';

export const listarOrdenesTrabajo = () => apiFetch(endpoint);
export const obtenerOrdenTrabajo = (id) => apiFetch(`/ordenes-trabajo/${id}`);
export const crearOrdenTrabajo = (payload) => apiFetch(endpoint, { method: 'POST', body: payload });
export const actualizarOrdenTrabajo = (id, payload) => apiFetch(`/ordenes-trabajo/${id}`, { method: 'PUT', body: payload });
export const anularOrdenTrabajo = (id) => actualizarOrdenTrabajo(id, { estado: 'ANULADA' });
export const registrarOrdenCompra = (id, payload) => apiFetch(`/ordenes-trabajo/${id}/orden-compra`, { method: 'PATCH', body: payload });
export const entregarOrdenTrabajo = (id, payload) => apiFetch(`/ordenes-trabajo/${id}/entregar`, { method: 'PUT', body: payload });
export const listarProduccionesPorOrdenTrabajo = (id) => apiFetch(`/ordenes-trabajo/${id}/ordenes-produccion`);
export const crearProduccionEnOrdenTrabajo = (id, payload) => (
  apiFetch(`/ordenes-trabajo/${id}/ordenes-produccion`, { method: 'POST', body: payload })
);
