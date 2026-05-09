import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { formatStatus, getStatusTone } from '../../utils/formatters';

function renderValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  return String(value);
}

export default function CrudTable({ columns, rows, onEdit, onDeactivate, onView }) {
  if (!rows.length) {
    return <div className="empty-state compact">No hay registros para mostrar.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="crud-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => {
                const value = column.render ? column.render(row) : row[column.key];
                return (
                  <td key={column.key}>
                    {column.key === 'estado' ? (
                      <Badge tone={getStatusTone(value)}>{formatStatus(value)}</Badge>
                    ) : (
                      renderValue(value)
                    )}
                  </td>
                );
              })}
              <td>
                <div className="table-actions">
                  {onView && <Button size="sm" variant="outline" onClick={() => onView(row)}>Ver</Button>}
                  {onEdit && <Button size="sm" variant="outline" onClick={() => onEdit(row)}>Editar</Button>}
                  {onDeactivate && row.estado !== 'INACTIVO' && (
                    <Button size="sm" variant="danger-outline" onClick={() => onDeactivate(row)}>
                      Desactivar
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
