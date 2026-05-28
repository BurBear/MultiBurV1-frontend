import Badge from '../ui/Badge';
import {
  formatIncidenciaValue,
  getIncidenciaEstadoTone,
  getIncidenciaPrioridadTone,
} from '../../utils/incidencias';

export default function IncidenciaEstadoBadge({ value, type = 'estado' }) {
  const tone = type === 'prioridad'
    ? getIncidenciaPrioridadTone(value)
    : getIncidenciaEstadoTone(value);

  return <Badge tone={tone}>{formatIncidenciaValue(value)}</Badge>;
}
