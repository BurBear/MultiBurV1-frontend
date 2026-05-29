import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import ActionIconButton from '../../components/ui/ActionIconButton';
import ConfirmDialog from '../../components/crud/ConfirmDialog';
import CrudTable from '../../components/crud/CrudTable';
import OrdenProduccionDetalleModal from '../../components/ordenes/OrdenProduccionDetalleModal';
import OrdenProduccionEditModal from '../../components/ordenes/OrdenProduccionEditModal';
import OrdenProduccionFormModal from '../../components/ordenes/OrdenProduccionFormModal';
import OrdenProduccionPrintDocument from '../../components/ordenes/OrdenProduccionPrintDocument';
import * as clientesService from '../../services/clientesService';
import * as materialesService from '../../services/materialesService';
import * as formatosService from '../../services/formatosService';
import * as maquinasService from '../../services/maquinasService';
import * as ordenesProduccionService from '../../services/ordenesProduccionService';
import { formatLocalDateTime } from '../../utils/datetime';
import { formatOrderCode } from '../../utils/formatters';

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function hasStartedProcesses(produccion) {
  return asArray(produccion.procesos).some((proceso) => proceso.estado !== 'PENDIENTE');
}

function canChangeProduccion(produccion) {
  return produccion.estado === 'PENDIENTE' && !hasStartedProcesses(produccion);
}

export default function OrdenesProduccion() {
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [printTarget, setPrintTarget] = useState(null);
  const [printLoadingId, setPrintLoadingId] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [anularTarget, setAnularTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ordenesData, clientesData, materialesData, formatosData, maquinasData] = await Promise.all([
        ordenesProduccionService.listarOrdenesProduccion(),
        clientesService.listar(),
        materialesService.listar(),
        formatosService.listar(),
        maquinasService.listar(),
      ]);
      setOrdenes(asArray(ordenesData));
      setClientes(asArray(clientesData));
      setMateriales(asArray(materialesData));
      setFormatos(asArray(formatosData));
      setMaquinas(asArray(maquinasData));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las ordenes de produccion.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleCrearServicio = async (payload) => {
    await ordenesProduccionService.crearOrdenProduccion({
      ...payload,
      orden_trabajo_id: null,
      tipo_origen: 'SERVICIO',
    });
    setShowForm(false);
    await loadData();
  };

  const loadDetail = async (orden) => {
    setSelected(orden);
    setDetailError('');
    setDetailLoading(true);
    try {
      const detail = await ordenesProduccionService.obtenerOrdenProduccion(orden.id);
      setSelected(detail || orden);
    } catch (err) {
      setDetailError(err.message || 'No se pudo cargar el detalle de la orden de produccion.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setDetailError('');
    setPrintTarget(null);
  };

  useEffect(() => {
    if (!printTarget) return undefined;

    const previousTitle = document.title;
    const code = formatOrderCode('OP', printTarget.codigo, printTarget.id).replace(/[^a-z0-9-]/gi, '_');
    const cleanup = () => {
      document.title = previousTitle;
      setPrintTarget(null);
      window.removeEventListener('afterprint', cleanup);
    };

    document.title = `OP_${code}`;
    window.addEventListener('afterprint', cleanup);
    const timer = window.setTimeout(() => window.print(), 150);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', cleanup);
    };
  }, [printTarget]);

  const handlePrintProduccion = async (orden) => {
    setPrintLoadingId(orden.id);
    try {
      const detail = await ordenesProduccionService.obtenerOrdenProduccion(orden.id);
      setPrintTarget(detail || orden);
    } catch (err) {
      setError(err.message || 'No se pudo preparar la impresion de la orden de produccion.');
    } finally {
      setPrintLoadingId('');
    }
  };

  const handleEditarProduccion = async (payload) => {
    if (!editTarget) return;
    setActionLoading(true);
    try {
      await ordenesProduccionService.actualizarOrdenProduccion(editTarget.id, payload);
      setEditTarget(null);
      await loadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnularProduccion = async () => {
    if (!anularTarget) return;
    const targetId = anularTarget.id;
    setActionLoading(true);
    setActionError('');
    try {
      await ordenesProduccionService.anularOrdenProduccion(anularTarget.id);
      setAnularTarget(null);
      await loadData();
      if (selected?.id === targetId) {
        closeDetail();
      }
    } catch (err) {
      setActionError(err.message || 'No se pudo anular la orden de produccion.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'codigo', label: 'Codigo', render: (row) => formatOrderCode('OP', row.codigo, row.id) },
    { key: 'descripcion', label: 'Descripcion' },
    { key: 'fecha_entrega_estimada', label: 'Entrega', render: (row) => formatLocalDateTime(row.fecha_entrega_estimada) },
    { key: 'cliente_id', label: 'Cliente', render: (row) => clientes.find((cliente) => cliente.id === row.cliente_id)?.nombre || row.cliente_id },
    { key: 'orden_trabajo_id', label: 'Orden trabajo' },
    { key: 'tipo_origen', label: 'Origen' },
    { key: 'tipo_servicio', label: 'Servicio' },
    { key: 'estado', label: 'Estado' },
    {
      key: 'acciones',
      label: 'Acciones',
      searchValue: () => '',
      render: (row) => {
        const editable = canChangeProduccion(row);
        const disabledTitle = editable ? '' : 'Solo se puede editar una OP pendiente y sin procesos iniciados.';

        return (
          <div className="table-actions">
            <ActionIconButton
              icon="view"
              label="Ver orden de produccion"
              onClick={() => loadDetail(row)}
              disabled={detailLoading && selected?.id === row.id}
            />
            <ActionIconButton
              icon="edit"
              label="Editar orden de produccion"
              onClick={() => setEditTarget(row)}
              disabled={!editable}
              title={disabledTitle}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="page-stack fade-in">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Ordenes de produccion</h2>
            <p>{ordenes.length} registros visibles</p>
          </div>
          <div className="section-actions">
            <Button
              className="icon-button"
              variant="outline"
              onClick={loadData}
              disabled={loading}
              aria-label="Refrescar"
              title="Refrescar"
            >
              &#x21bb;
            </Button>
            <Button onClick={() => setShowForm(true)}>+ Servicio directo</Button>
          </div>
        </div>

        {loading ? (
          <p className="muted">Cargando...</p>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <CrudTable columns={columns} rows={ordenes} />
        )}
      </section>

      {showForm && (
        <OrdenProduccionFormModal
          title="Nueva orden de produccion de servicio"
          clientes={clientes}
          materiales={materiales}
          formatos={formatos}
          maquinas={maquinas}
          defaults={{ orden_trabajo_id: null, tipo_origen: 'SERVICIO' }}
          onClose={() => setShowForm(false)}
          onSubmit={handleCrearServicio}
        />
      )}

      {selected && (
        <OrdenProduccionDetalleModal
          produccion={selected}
          clientes={clientes}
          materiales={materiales}
          formatos={formatos}
          maquinas={maquinas}
          loading={detailLoading}
          error={detailError}
          printLoading={printLoadingId === selected.id}
          onClose={closeDetail}
          onRefresh={loadDetail}
          onPrint={handlePrintProduccion}
          canAnular={canChangeProduccion(selected)}
          onAnular={(orden) => {
            setActionError('');
            setAnularTarget(orden);
          }}
        />
      )}

      {editTarget && (
        <OrdenProduccionEditModal
          orden={editTarget}
          materiales={materiales}
          formatos={formatos}
          maquinas={maquinas}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditarProduccion}
        />
      )}

      {anularTarget && (
        <ConfirmDialog
          title="Anular orden de produccion"
          message={
            actionError
              || `Se anulara ${formatOrderCode('OP', anularTarget.codigo, anularTarget.id)}. Esta accion conserva el registro, pero lo retira del flujo operativo.`
          }
          onCancel={() => {
            setAnularTarget(null);
            setActionError('');
          }}
          onConfirm={handleAnularProduccion}
          loading={actionLoading}
        />
      )}

      {printTarget && (
        <OrdenProduccionPrintDocument
          produccion={printTarget}
          clientes={clientes}
          materiales={materiales}
          formatos={formatos}
          maquinas={maquinas}
        />
      )}
    </div>
  );
}
