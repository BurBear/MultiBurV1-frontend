import Button from '../ui/Button';
import Select from '../ui/Select';
import {
  INCIDENCIA_ESTADOS,
  INCIDENCIA_PRIORIDADES,
  INCIDENCIA_PROCESOS,
  INCIDENCIA_TIPOS,
  formatIncidenciaValue,
} from '../../utils/incidencias';

export default function IncidenciaFilters({ filters, onChange, onClear, loading = false }) {
  const setFilter = (name, value) => {
    onChange({ ...filters, [name]: value });
  };

  return (
    <div className="global-board-filters">
      <Select
        label="Estado"
        name="estado"
        value={filters.estado || 'TODOS'}
        onChange={(event) => setFilter('estado', event.target.value)}
      >
        <option value="TODOS">Todos</option>
        {INCIDENCIA_ESTADOS.map((estado) => (
          <option key={estado} value={estado}>{formatIncidenciaValue(estado)}</option>
        ))}
      </Select>

      <Select
        label="Tipo"
        name="tipo"
        value={filters.tipo || 'TODOS'}
        onChange={(event) => setFilter('tipo', event.target.value)}
      >
        <option value="TODOS">Todos</option>
        {INCIDENCIA_TIPOS.map((tipo) => (
          <option key={tipo} value={tipo}>{formatIncidenciaValue(tipo)}</option>
        ))}
      </Select>

      <Select
        label="Prioridad"
        name="prioridad"
        value={filters.prioridad || 'TODOS'}
        onChange={(event) => setFilter('prioridad', event.target.value)}
      >
        <option value="TODOS">Todas</option>
        {INCIDENCIA_PRIORIDADES.map((prioridad) => (
          <option key={prioridad} value={prioridad}>{formatIncidenciaValue(prioridad)}</option>
        ))}
      </Select>

      <Select
        label="Proceso"
        name="tipo_proceso"
        value={filters.tipo_proceso || 'TODOS'}
        onChange={(event) => setFilter('tipo_proceso', event.target.value)}
      >
        <option value="TODOS">Todos</option>
        {INCIDENCIA_PROCESOS.map((proceso) => (
          <option key={proceso} value={proceso}>{formatIncidenciaValue(proceso)}</option>
        ))}
      </Select>

      <div className="form-actions">
        <Button variant="outline" onClick={onClear} disabled={loading}>Limpiar</Button>
      </div>
    </div>
  );
}
