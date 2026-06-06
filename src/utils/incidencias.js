import { ACABADOS_PROCESS_TYPES } from './procesos';

export const INCIDENCIA_ESTADOS = ['REGISTRADA', 'EN_PROCESO', 'RESUELTA'];

export const INCIDENCIA_PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];

export const INCIDENCIA_TIPOS = ['MATERIAL', 'MAQUINA', 'CALIDAD', 'RETRASO', 'OTRO'];

export const INCIDENCIA_PROCESOS = ['DISEÑO', 'PLACAS', 'IMPRESION', 'ACABADOS', ...ACABADOS_PROCESS_TYPES];

export function formatIncidenciaValue(value) {
  return String(value || '-').replaceAll('_', ' ');
}

export function getIncidenciaEstadoTone(estado) {
  if (estado === 'RESUELTA') return 'success';
  if (estado === 'EN_PROCESO') return 'info';
  if (estado === 'REGISTRADA') return 'warning';
  return 'neutral';
}

export function getIncidenciaPrioridadTone(prioridad) {
  if (prioridad === 'CRITICA') return 'danger';
  if (prioridad === 'ALTA') return 'warning';
  if (prioridad === 'MEDIA') return 'info';
  return 'neutral';
}
