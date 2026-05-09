import { apiFetch } from './api';

const endpoint = '/maquinas/';

export const listar = () => apiFetch(endpoint);
export const obtenerPorId = (id) => apiFetch(`/maquinas/${id}`);
export const crear = (payload) => apiFetch(endpoint, { method: 'POST', body: payload });
export const actualizar = (id, payload) => apiFetch(`/maquinas/${id}`, { method: 'PUT', body: payload });
export const desactivar = (id) => actualizar(id, { estado: 'INACTIVO' });
