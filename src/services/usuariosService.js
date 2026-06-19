import { apiFetch } from './api';

const endpoint = '/users/';

export const listar = () => apiFetch(endpoint);
export const obtenerPorId = (id) => apiFetch(`/users/${id}`);
export const crear = (payload) => apiFetch(endpoint, { method: 'POST', body: payload });
export const actualizar = (id, payload) => apiFetch(`/users/${id}`, { method: 'PUT', body: payload });
export const actualizarEstado = (id, isActive) => (
  apiFetch(`/users/${id}/estado`, { method: 'PATCH', body: { is_active: isActive } })
);
export const cambiarPassword = (id, password) => (
  apiFetch(`/users/${id}/password`, { method: 'PATCH', body: { password } })
);
