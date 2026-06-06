import { apiFetch } from './api';

const endpoint = '/formatos/';

export const listar = () => apiFetch(endpoint);
export const obtenerPorId = (id) => apiFetch(`/formatos/${id}`);
export const crear = (payload) => apiFetch(endpoint, { method: 'POST', body: payload });
export const actualizar = (id, payload) => apiFetch(`/formatos/${id}`, { method: 'PUT', body: payload });
export const desactivar = (id) => actualizar(id, { estado: 'INACTIVO' });
