import { apiFetch } from './api';

const endpoint = '/clientes/';

export const listar = () => apiFetch(endpoint);
export const obtenerPorId = (id) => apiFetch(`/clientes/${id}`);
export const crear = (payload) => apiFetch(endpoint, { method: 'POST', body: payload });
export const actualizar = (id, payload) => apiFetch(`/clientes/${id}`, { method: 'PUT', body: payload });
export const desactivar = (id) => actualizar(id, { estado: 'INACTIVO' });
