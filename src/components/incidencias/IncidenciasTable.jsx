import { useMemo, useState } from 'react';
import Button from '../ui/Button';
import IncidenciaEstadoBadge from './IncidenciaEstadoBadge';
import { formatDateTime } from '../../utils/datetime';
import { formatOrderCode } from '../../utils/formatters';
import { formatIncidenciaValue } from '../../utils/incidencias';

const limitOptions = [5, 10, 25, 'TODOS'];

function getOrdenLabel(incidencia) {
  if (incidencia.orden_produccion_id) return formatOrderCode('OP', incidencia.orden_produccion_codigo, incidencia.orden_produccion_id);
  if (incidencia.orden_id || incidencia.orden_trabajo_id) return formatOrderCode('OT', incidencia.orden_codigo, incidencia.orden_id || incidencia.orden_trabajo_id);
  return '-';
}

function getProcesoLabel(incidencia) {
  return incidencia.tipo_proceso || incidencia.proceso_nombre || '-';
}

export default function IncidenciasTable({
  incidencias = [],
  onView,
  onEdit,
  onChangeStatus,
  onCloseIncidencia,
}) {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const totalPages = limit === 'TODOS' ? 1 : Math.max(1, Math.ceil(incidencias.length / Number(limit)));
  const safePage = Math.min(page, totalPages);
  const visibleRows = useMemo(() => {
    if (limit === 'TODOS') return incidencias;
    const start = (safePage - 1) * Number(limit);
    return incidencias.slice(start, start + Number(limit));
  }, [incidencias, limit, safePage]);

  const handleLimitChange = (event) => {
    setLimit(event.target.value === 'TODOS' ? 'TODOS' : Number(event.target.value));
    setPage(1);
  };

  if (!incidencias.length) {
    return <div className="empty-state compact">No hay incidencias para mostrar.</div>;
  }

  return (
    <div className="table-block">
      <div className="table-toolbar">
        <span>{visibleRows.length} de {incidencias.length} incidencias</span>
        <label className="table-limit-control">
          <span>Filas</span>
          <select value={limit} onChange={handleLimitChange}>
            {limitOptions.map((option) => (
              <option key={option} value={option}>{option === 'TODOS' ? 'Todos' : option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-wrap">
        <table className="crud-table">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Proceso</th>
              <th>Tipo</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Creacion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((incidencia) => (
              <tr key={incidencia.id}>
                <td>{getOrdenLabel(incidencia)}</td>
                <td>{getProcesoLabel(incidencia)}</td>
                <td>{formatIncidenciaValue(incidencia.tipo)}</td>
                <td><IncidenciaEstadoBadge value={incidencia.prioridad} type="prioridad" /></td>
                <td><IncidenciaEstadoBadge value={incidencia.estado} /></td>
                <td>{formatDateTime(incidencia.fecha_registro || incidencia.fecha_creacion || incidencia.created_at)}</td>
                <td>
                  <div className="table-actions">
                    {onView && <Button size="sm" variant="outline" onClick={() => onView(incidencia)}>Ver</Button>}
                    {onEdit && <Button size="sm" variant="outline" onClick={() => onEdit(incidencia)}>Editar</Button>}
                    {onChangeStatus && incidencia.estado !== 'RESUELTA' && (
                      <Button size="sm" variant="outline" onClick={() => onChangeStatus(incidencia)}>Estado</Button>
                    )}
                    {onCloseIncidencia && incidencia.estado !== 'RESUELTA' && (
                      <Button size="sm" variant="success" onClick={() => onCloseIncidencia(incidencia)}>Cerrar</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-pagination">
        <span>Pagina {safePage} de {totalPages}</span>
        <div className="table-pagination-actions">
          <Button variant="outline" size="sm" onClick={() => setPage((current) => current - 1)} disabled={safePage <= 1}>
            {'<'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={safePage >= totalPages}>
            {'>'}
          </Button>
        </div>
      </div>
    </div>
  );
}
