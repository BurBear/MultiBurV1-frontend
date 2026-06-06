export const BASE_PROCESS_TYPES = ['DISEÑO', 'PLACAS', 'IMPRESION', 'ACABADOS'];

export const PLASTIFICADO_OPTION = 'PLASTIFICADO';

export const PLASTIFICADO_MODE_OPTIONS = [
  { label: 'BRILLO', value: 'PLASTIFICADO BRILLANTE' },
  { label: 'MATE', value: 'PLASTIFICADO MATE' },
];

export const ACABADOS_ROUTE_OPTIONS = [
  'CORTE',
  'EMPAQUETADO',
  'DOBLEZ',
  'COMPAGINADO',
  'TROQUELADO',
  'SECTORIZADO',
  'BARNIZ',
  PLASTIFICADO_OPTION,
  'ENCOLADO',
  'MARCADO',
  'ANILLADO',
  'PERFORADO',
  'PEGADO SOLAPA',
  'SEMI CORTE',
  'ENUMERADO',
];

export const ACABADOS_PROCESS_TYPES = [
  ...ACABADOS_ROUTE_OPTIONS,
  ...PLASTIFICADO_MODE_OPTIONS.map((option) => option.value),
];

export function isPlastificadoProcess(value) {
  return value === PLASTIFICADO_OPTION || PLASTIFICADO_MODE_OPTIONS.some((option) => option.value === value);
}

export function getProcessArea(proceso) {
  const tipo = proceso?.tipo_proceso || proceso;
  const area = proceso?.area;
  if (area) return area;
  if (tipo === 'ACABADOS' || ACABADOS_PROCESS_TYPES.includes(tipo)) return 'ACABADOS';
  return tipo || '';
}

export function serviceIncludesAcabados(tipoServicio, procesosPersonalizados = []) {
  if (['COMPLETO', 'SOLO_IMPRESION'].includes(tipoServicio)) return true;
  return tipoServicio === 'PERSONALIZADO' && procesosPersonalizados.includes('ACABADOS');
}
