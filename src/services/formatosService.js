import { apiFetch } from './api';
import { buscarFormatoPorMedidas } from '../utils/formatos';

const endpoint = '/formatos/';

export const listar = () => apiFetch(endpoint);
export const obtenerPorId = (id) => apiFetch(`/formatos/${id}`);
export const crear = (payload) => apiFetch(endpoint, { method: 'POST', body: payload });
export const actualizar = (id, payload) => apiFetch(`/formatos/${id}`, { method: 'PUT', body: payload });
export const desactivar = (id) => actualizar(id, { estado: 'INACTIVO' });

export async function obtenerOCrearPersonalizado(alto, ancho) {
  // Consultar el catalogo actualizado permite reutilizar el formato al reintentar una orden.
  const data = await listar();
  const formatos = Array.isArray(data) ? data : (data?.items || []);
  const existente = buscarFormatoPorMedidas(formatos, alto, ancho);
  if (existente) return existente;

  return crear({
    nombre: `Personalizado (alto ${Number(alto)} x ancho ${Number(ancho)} cm)`,
    alto: Number(alto),
    ancho: Number(ancho),
    unidad_medida: 'CM',
  });
}
