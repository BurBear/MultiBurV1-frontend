import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import CrudTable from '../../components/crud/CrudTable';
import CrudFormModal from '../../components/crud/CrudFormModal';
import ConfirmDialog from '../../components/crud/ConfirmDialog';

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export default function CatalogCrudPage({ title, subtitle, columns, fields, service, validate }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await service.listar();
      setRows(asArray(data));
    } catch (err) {
      setError(err.message || 'No se pudo cargar la informacion.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRows();
  }, [loadRows]);

  const handleSubmit = async (payload) => {
    if (editing) {
      await service.actualizar(editing.id, payload);
    } else {
      await service.crear(payload);
    }
    setShowForm(false);
    setEditing(null);
    await loadRows();
  };

  const handleDeactivate = async () => {
    if (!confirmRow) return;
    setDeactivating(true);
    try {
      await service.desactivar(confirmRow.id);
      setConfirmRow(null);
      await loadRows();
    } catch (err) {
      setError(err.message || 'No se pudo desactivar el registro.');
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="page-stack fade-in">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>{title}</h2>
            <p>{subtitle} - {rows.length} registros cargados</p>
          </div>
          <div className="section-actions">
            <Button
              className="icon-button"
              variant="outline"
              onClick={loadRows}
              disabled={loading}
              aria-label="Refrescar"
              title="Refrescar"
            >
              ↻
            </Button>
            <Button onClick={() => setShowForm(true)}>+ Nuevo</Button>
          </div>
        </div>

        {loading ? (
          <p className="muted">Cargando...</p>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <CrudTable
            columns={columns}
            rows={rows}
            onEdit={(row) => {
              setEditing(row);
              setShowForm(true);
            }}
            onDeactivate={setConfirmRow}
          />
        )}
      </section>

      {showForm && (
        <CrudFormModal
          title={editing ? `Editar ${title}` : `Nuevo ${title}`}
          fields={fields}
          initialData={editing}
          validate={validate}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      {confirmRow && (
        <ConfirmDialog
          title="Desactivar registro"
          message={`Se desactivara "${confirmRow.nombre || confirmRow.codigo || confirmRow.id}".`}
          loading={deactivating}
          onCancel={() => setConfirmRow(null)}
          onConfirm={handleDeactivate}
        />
      )}
    </div>
  );
}
