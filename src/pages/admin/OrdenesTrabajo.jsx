import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import CrudTable from '../../components/crud/CrudTable';
import OrdenTrabajoFormModal from '../../components/ordenes/OrdenTrabajoFormModal';
import OrdenProduccionFormModal from '../../components/ordenes/OrdenProduccionFormModal';
import * as clientesService from '../../services/clientesService';
import * as materialesService from '../../services/materialesService';
import * as formatosService from '../../services/formatosService';
import * as maquinasService from '../../services/maquinasService';
import * as ordenesTrabajoService from '../../services/ordenesTrabajoService';
import { formatStatus, getStatusTone } from '../../utils/formatters';

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export default function OrdenesTrabajo() {
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [selected, setSelected] = useState(null);
  const [producciones, setProducciones] = useState([]);
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
      const [detail, produccionesData] = await Promise.all([
        ordenesTrabajoService.obtenerOrdenTrabajo(orden.id),
        ordenesTrabajoService.listarProduccionesPorOrdenTrabajo(orden.id),
      ]);
      setSelected(detail);
      setProducciones(asArray(produccionesData));
    } catch (err) {
      setError(err.message || 'No se pudo cargar el detalle de la orden de trabajo.');
      setProducciones([]);
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
    await ordenesTrabajoService.crearProduccionEnOrdenTrabajo(selected.id, {
      ...payload,
      orden_trabajo_id: selected.id,
      cliente_id: selected.cliente_id,
      tipo_origen: 'COMPLETO',
    });
    setShowProduccionForm(false);
    await loadDetail(selected);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelected(null);
    setProducciones([]);
  };

  const columns = [
    { key: 'codigo', label: 'Codigo' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'cliente_id', label: 'Cliente', render: (row) => clientes.find((cliente) => cliente.id === row.cliente_id)?.nombre || row.cliente_id },
    { key: 'producciones', label: 'Producciones', render: (row) => row.ordenes_produccion_count ?? row.producciones_count ?? '-' },
    { key: 'estado', label: 'Estado' },
  ];

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
              <Button onClick={() => setShowProduccionForm(true)}>+ Agregar produccion</Button>
            </div>
          </div>

          {detailLoading ? (
            <p className="muted">Cargando detalle...</p>
          ) : (
            <>
              <div className="detail-grid">
                <Card className="detail-card"><span>Codigo</span><strong>{selected.codigo || '-'}</strong></Card>
                <Card className="detail-card"><span>Estado</span><Badge tone={getStatusTone(selected.estado)}>{formatStatus(selected.estado)}</Badge></Card>
                <Card className="detail-card"><span>Entrega estimada</span><strong>{selected.fecha_entrega_estimada || '-'}</strong></Card>
              </div>

              <div className="subsection">
                <h3>Ordenes de produccion internas</h3>
                <CrudTable
                  columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'descripcion', label: 'Descripcion' },
                    { key: 'cantidad', label: 'Cantidad' },
                    { key: 'tipo_servicio', label: 'Servicio' },
                    { key: 'estado', label: 'Estado' },
                  ]}
                  rows={producciones}
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

      {showProduccionForm && selected && (
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
    </div>
  );
}
