import { useMemo, useState } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { formatStatus, getStatusTone } from '../../utils/formatters';

const limitOptions = [5, 10, 25, 'TODOS'];
const searchableColumnTypes = new Set(['string', 'number', 'boolean']);

function renderValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  return String(value);
}

export default function CrudTable({ columns, rows, onEdit, onDeactivate, onView }) {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const hasStatusColumn = columns.some((column) => column.key === 'estado');

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesStatus = statusFilter === 'TODOS' || row.estado === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      return columns.some((column) => {
        const rawValue = column.render ? column.render(row) : row[column.key];
        if (!searchableColumnTypes.has(typeof rawValue)) return false;
        return String(rawValue).toLowerCase().includes(normalizedSearch);
      });
    });
  }, [columns, rows, search, statusFilter]);

  const totalPages = limit === 'TODOS' ? 1 : Math.max(1, Math.ceil(filteredRows.length / Number(limit)));
  const safePage = Math.min(page, totalPages);
  const visibleRows = useMemo(() => {
    if (limit === 'TODOS') return filteredRows;
    const start = (safePage - 1) * Number(limit);
    return filteredRows.slice(start, start + Number(limit));
  }, [filteredRows, limit, safePage]);

  const statusOptions = useMemo(() => {
    return [...new Set(rows.map((row) => row.estado).filter(Boolean))];
  }, [rows]);

  const handleLimitChange = (event) => {
    setLimit(event.target.value === 'TODOS' ? 'TODOS' : Number(event.target.value));
    setPage(1);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  if (!rows.length) {
    return <div className="empty-state compact">No hay registros para mostrar.</div>;
  }

  return (
    <div className="table-block">
      <div className="table-toolbar">
        <div className="table-filter-row">
          <label className="table-search">
            <span>Buscar</span>
            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar registro..."
            />
          </label>

          {hasStatusColumn && (
            <label className="table-filter-control">
              <span>Estado</span>
              <select value={statusFilter} onChange={handleStatusChange}>
                <option value="TODOS">Todos</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="table-filter-row table-filter-row-right">
          <span>
            {filteredRows.length === 0 ? '0 registros' : `${visibleRows.length} de ${filteredRows.length} registros`}
          </span>
          <label className="table-limit-control">
            <span>Filas</span>
            <select value={limit} onChange={handleLimitChange}>
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'TODOS' ? 'Todos' : option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {visibleRows.length === 0 ? (
        <div className="empty-state compact">No hay registros que coincidan con el filtro.</div>
      ) : (
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
              {visibleRows.map((row) => (
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
      )}

      <div className="table-pagination">
        <span>
          Pagina {safePage} de {totalPages}
        </span>
        <div className="table-pagination-actions">
          <Button variant="outline" size="sm" onClick={() => setPage((current) => current - 1)} disabled={safePage <= 1}>
            ‹
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={safePage >= totalPages}>
            ›
          </Button>
        </div>
      </div>
    </div>
  );
}
