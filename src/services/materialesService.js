import { apiFetch } from './api';

const endpoint = '/materiales/';

export const listar = () => apiFetch(endpoint);
export const obtenerPorId = (id) => apiFetch(`/materiales/${id}`);
export const crear = (payload) => apiFetch(endpoint, { method: 'POST', body: payload });
export const actualizar = (id, payload) => apiFetch(`/materiales/${id}`, { method: 'PUT', body: payload });
export const desactivar = (id) => actualizar(id, { estado: 'INACTIVO' });
