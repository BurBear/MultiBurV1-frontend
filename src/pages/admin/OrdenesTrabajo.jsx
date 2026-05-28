import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import CrudTable from '../../components/crud/CrudTable';
import IncidenciaDetalleModal from '../../components/incidencias/IncidenciaDetalleModal';
import IncidenciasTable from '../../components/incidencias/IncidenciasTable';
import OrdenTrabajoFormModal from '../../components/ordenes/OrdenTrabajoFormModal';
import OrdenProduccionFormModal from '../../components/ordenes/OrdenProduccionFormModal';
import * as clientesService from '../../services/clientesService';
import * as materialesService from '../../services/materialesService';
import * as formatosService from '../../services/formatosService';
import * as maquinasService from '../../services/maquinasService';
import * as ordenesTrabajoService from '../../services/ordenesTrabajoService';
import * as incidenciasService from '../../services/incidenciasService';
import { formatLocalDateTime } from '../../utils/datetime';
import { formatOrderCode, formatStatus, getStatusTone } from '../../utils/formatters';

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function getEntregaLabel(row) {
  return row.fecha_entrega_estimada || '-';
}

function getProduccionesSearch(row) {
  const producciones = asArray(row.ordenes_produccion);
  if (producciones.length === 0) return 'Sin producciones';

  return producciones
    .map((produccion) => `${formatOrderCode('OP', produccion.codigo, produccion.id)} ${formatStatus(produccion.estado)}`)
    .join(' ');
}

function ProduccionesList({ row }) {
  const producciones = asArray(row.ordenes_produccion);

  if (producciones.length === 0) {
    return (
      <div className="production-list-cell production-list-empty-cell">
        <small>Sin producciones</small>
      </div>
    );
  }

  return (
    <div className="production-list-cell">
      {producciones.map((produccion) => (
        <div key={produccion.id} className="production-list-item">
          <strong>{formatOrderCode('OP', produccion.codigo, produccion.id)}</strong>
          <Badge tone={getStatusTone(produccion.estado)}>{formatStatus(produccion.estado)}</Badge>
        </div>
      ))}
    </div>
  );
}

export default function OrdenesTrabajo() {
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [selected, setSelected] = useState(null);
  const [producciones, setProducciones] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [selectedIncidencia, setSelectedIncidencia] = useState(null);
  const [incidenciaHistorial, setIncidenciaHistorial] = useState([]);
  const [incidenciaHistorialLoading, setIncidenciaHistorialLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProduccionForm, setShowProduccionForm] = useState(false);

  const loadInitial = async () => {
    setLoading(true);
    setError('');
    try {
      const [ordenesData, clientesData, materialesData, formatosData, maquinasData] = await Promise.all([
        ordenesTrabajoService.listarOrdenesTrabajo(),
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
      setError(err.message || 'No se pudieron cargar las ordenes de trabajo.');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (orden) => {
    setSelected(orden);
    setShowDetailModal(true);
    setDetailLoading(true);
    setError('');
    try {
      const [detail, produccionesData, incidenciasData] = await Promise.all([
        ordenesTrabajoService.obtenerOrdenTrabajo(orden.id),
        ordenesTrabajoService.listarProduccionesPorOrdenTrabajo(orden.id),
        incidenciasService.listarIncidenciasPorOrdenTrabajo(orden.id),
      ]);
      setSelected(detail);
      setProducciones(asArray(produccionesData));
      setIncidencias(asArray(incidenciasData));
    } catch (err) {
      setError(err.message || 'No se pudo cargar el detalle de la orden de trabajo.');
      setProducciones([]);
      setIncidencias([]);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInitial();
  }, []);

  const handleCrearOrden = async (payload) => {
    await ordenesTrabajoService.crearOrdenTrabajo(payload);
    setShowForm(false);
    await loadInitial();
  };

  const handleCrearProduccion = async (payload) => {
    if (selected?.estado === 'ENTREGADA') {
      setError('No puedes agregar producciones a una orden de trabajo entregada.');
      setShowProduccionForm(false);
      return;
    }

    await ordenesTrabajoService.crearProduccionEnOrdenTrabajo(selected.id, {
      ...payload,
      orden_trabajo_id: selected.id,
      cliente_id: selected.cliente_id,
      tipo_origen: 'COMPLETO',
    });
    setShowProduccionForm(false);
    await loadDetail(selected);
  };

  const loadIncidenciaHistorial = async (incidenciaId) => {
    setIncidenciaHistorialLoading(true);
    try {
      const data = await incidenciasService.listarHistorialIncidencia(incidenciaId);
      setIncidenciaHistorial(asArray(data));
    } catch (err) {
      setError(err.message || 'No se pudo cargar el historial de la incidencia.');
      setIncidenciaHistorial([]);
    } finally {
      setIncidenciaHistorialLoading(false);
    }
  };

  const openIncidenciaDetail = async (incidencia) => {
    setSelectedIncidencia(incidencia);
    try {
      const detail = await incidenciasService.obtenerIncidencia(incidencia.id);
      setSelectedIncidencia(detail);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el detalle de la incidencia.');
    }
    await loadIncidenciaHistorial(incidencia.id);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelected(null);
    setProducciones([]);
    setIncidencias([]);
  };

  const columns = [
    {
      key: 'codigo',
      label: 'Codigo',
      searchValue: (row) => `${row.codigo || ''} ${row.fecha_entrega_estimada || ''}`,
      render: (row) => (
        <div className="table-cell-stack">
          <strong>{formatOrderCode('OT', row.codigo, row.id)}</strong>
          <small>Entrega: {getEntregaLabel(row)}</small>
        </div>
      ),
    },
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripcion' },
    { key: 'cliente_id', label: 'Cliente', render: (row) => clientes.find((cliente) => cliente.id === row.cliente_id)?.nombre || row.cliente_id },
    {
      key: 'produccion_resumen',
      label: 'Producciones',
      searchValue: getProduccionesSearch,
      render: (row) => <ProduccionesList row={row} />,
    },
    { key: 'estado', label: 'Estado' },
  ];

  const selectedEntregada = selected?.estado === 'ENTREGADA';

  return (
    <div className="page-stack fade-in">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Ordenes de trabajo</h2>
            <p>{ordenes.length} registros cargados</p>
          </div>
          <div className="section-actions">
            <Button
              className="icon-button"
              variant="outline"
              onClick={loadInitial}
              disabled={loading}
              aria-label="Refrescar"
              title="Refrescar"
            >
              ↻
            </Button>
            <Button onClick={() => setShowForm(true)}>+ Nueva orden</Button>
          </div>
        </div>

        {loading ? (
          <p className="muted">Cargando...</p>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <CrudTable columns={columns} rows={ordenes} onView={loadDetail} />
        )}
      </section>

      {showDetailModal && selected && (
        <Modal
          title={`Detalle: ${selected.nombre || selected.codigo || 'Orden de trabajo'}`}
          onClose={closeDetailModal}
          panelClassName="modal-panel-wide"
        >
          <div className="section-heading">
            <div>
              <p>Cliente #{selected.cliente_id} - {producciones.length} ordenes de produccion asociadas</p>
            </div>
            <div className="section-actions">
              <Button
                className="icon-button"
                variant="outline"
                onClick={() => loadDetail(selected)}
                disabled={detailLoading}
                aria-label="Refrescar detalle"
                title="Refrescar detalle"
              >
                ↻
              </Button>
              {!selectedEntregada && (
                <Button onClick={() => setShowProduccionForm(true)}>+ Agregar produccion</Button>
              )}
            </div>
          </div>

          {detailLoading ? (
            <p className="muted">Cargando detalle...</p>
          ) : (
            <>
              {selectedEntregada && (
                <div className="alert alert-success">
                  Orden entregada. No se pueden agregar mas ordenes de produccion.
                </div>
              )}

              <div className="detail-grid">
                <Card className="detail-card">
                  <span>Codigo</span>
                  <strong>{formatOrderCode('OT', selected.codigo, selected.id)}</strong>
                  <small>Entrega estimada: {getEntregaLabel(selected)}</small>
                </Card>
                <Card className="detail-card"><span>Estado</span><Badge tone={getStatusTone(selected.estado)}>{formatStatus(selected.estado)}</Badge></Card>
                <Card className="detail-card">
                  <span>Orden de compra</span>
                  <strong>{selected.tiene_orden_compra ? selected.numero_orden_compra || 'OC pendiente' : 'No requiere OC'}</strong>
                  {selected.tiene_orden_compra && selected.fecha_orden_compra && <small>{selected.fecha_orden_compra}</small>}
                </Card>
                <Card className="detail-card detail-card-wide"><span>Descripcion</span><strong>{selected.descripcion || '-'}</strong></Card>
              </div>

              <div className="subsection">
                <h3>Ordenes de produccion internas</h3>
                <CrudTable
                  columns={[
                    { key: 'codigo', label: 'Codigo', render: (row) => row.codigo || '-' },
                    { key: 'descripcion', label: 'Descripcion' },
                    { key: 'fecha_entrega_estimada', label: 'Entrega', render: (row) => formatLocalDateTime(row.fecha_entrega_estimada) },
                    { key: 'cantidad', label: 'Cantidad' },
                    { key: 'tipo_servicio', label: 'Servicio' },
                    { key: 'estado', label: 'Estado' },
                  ]}
                  rows={producciones}
                />
              </div>

              <div className="subsection">
                <h3>Incidencias</h3>
                <IncidenciasTable
                  incidencias={incidencias}
                  onView={openIncidenciaDetail}
                />
              </div>
            </>
          )}
        </Modal>
      )}

      {showForm && (
        <OrdenTrabajoFormModal
          clientes={clientes}
          onClose={() => setShowForm(false)}
          onSubmit={handleCrearOrden}
        />
      )}

      {showProduccionForm && selected && !selectedEntregada && (
        <OrdenProduccionFormModal
          title="Nueva produccion interna"
          clientes={clientes}
          materiales={materiales}
          formatos={formatos}
          maquinas={maquinas}
          defaults={{ cliente_id: selected.cliente_id, orden_trabajo_id: selected.id, tipo_origen: 'COMPLETO' }}
          lockCliente
          onClose={() => setShowProduccionForm(false)}
          onSubmit={handleCrearProduccion}
        />
      )}

      {selectedIncidencia && (
        <IncidenciaDetalleModal
          incidencia={selectedIncidencia}
          historial={incidenciaHistorial}
          historialLoading={incidenciaHistorialLoading}
          onClose={() => {
            setSelectedIncidencia(null);
            setIncidenciaHistorial([]);
          }}
          onRefreshHistorial={() => loadIncidenciaHistorial(selectedIncidencia.id)}
        />
      )}
    </div>
  );
}
