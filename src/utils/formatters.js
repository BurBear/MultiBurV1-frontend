export function formatNumber(value) {
  return new Intl.NumberFormat('es-PE').format(Number(value || 0));
}

export function formatOrderCode(prefix, codigo, id) {
  if (codigo) return codigo;
  return `${prefix}-${String(id || 0).padStart(4, '0')}`;
}

export function formatStatus(value) {
  return String(value || 'SIN_ESTADO').replaceAll('_', ' ');
}

export function getStatusTone(status) {
  if (status === 'LISTO') return 'success';
  if (status === 'ENTREGADA') return 'success';
  if (status === 'TERMINADO') return 'success';
  if (status === 'EN_PROCESO') return 'info';
  if (status === 'PAUSADO') return 'warning';
  if (status === 'ANULADA') return 'danger';
  return 'neutral';
}
