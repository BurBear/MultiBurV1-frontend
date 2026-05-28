import { apiFetch, BASE_URL } from './api';

const endpoint = '/clientes/';

export const listar = () => apiFetch(endpoint);
export const obtenerPorId = (id) => apiFetch(`/clientes/${id}`);
export const crear = (payload) => apiFetch(endpoint, { method: 'POST', body: payload });
export const actualizar = (id, payload) => apiFetch(`/clientes/${id}`, { method: 'PUT', body: payload });
export const desactivar = (id) => actualizar(id, { estado: 'INACTIVO' });

async function parseDownloadError(response) {
  const text = await response.text();
  if (!text) return `Error en la descarga: ${response.status}`;

  try {
    const data = JSON.parse(text);
    return data.detail || text;
  } catch {
    return text;
  }
}

export const exportarCsv = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/clientes/exportar/csv`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(await parseDownloadError(response));
  }

  return response.blob();
};

export const importarCsv = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch('/clientes/importar/csv', { method: 'POST', body: formData });
};
