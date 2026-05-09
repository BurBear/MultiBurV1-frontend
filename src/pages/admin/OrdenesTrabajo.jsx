import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import CrudTable from '../../components/crud/CrudTable';
import CrudFormModal from '../../components/crud/CrudFormModal';
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

function optionLabel(item) {
  return item.nombre || item.codigo || `ID ${item.id}`;
}

const estadoOptions = [
  { value: 'PENDIENTE', label: 'PENDIENTE' },
  { value: 'EN_PROCESO', label: 'EN PROCESO' },
  { value: 'TERMINADO', label: 'TERMINADO' },
  { value: 'ANULADA', label: 'ANULADA' },
];

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
  const [showProduccionForm, setShowProduccionForm] = useState(false);

  const clienteOptions = useMemo(() => clientes.map((cliente) => ({
    value: cliente.id,
    label: optionLabel(cliente),
  })), [clientes]);

  const fields = useMemo(() => [
    { name: 'cliente_id', label: 'Cliente', type: 'select', options: clienteOptions, placeholder: 'Selecciona cliente', required: true },
    { name: 'codigo', label: 'Codigo' },
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'descripcion', label: 'Descripcion', type: 'textarea' },
    { name: 'tiene_orden_compra', label: 'Tiene orden de compra', type: 'checkbox', defaultValue: false },
    {
      name: 'numero_orden_compra',
      label: 'Numero orden de compra',
      hidden: (values) => !values.tiene_orden_compra,
    },
    {
      name: 'fecha_orden_compra',
      label: 'Fecha orden de compra',
      type: 'date',
      hidden: (values) => !values.tiene_orden_compra,
    },
    { name: 'fecha_entrega_estimada', label: 'Fecha entrega estimada', type: 'date' },
    { name: 'estado', label: 'Estado', type: 'select', options: estadoOptions, defaultValue: 'PENDIENTE' },
  ], [clienteOptions]);

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
    const nextPayload = { ...payload, cliente_id: Number(payload.cliente_id) };
    if (!nextPayload.tiene_orden_compra) {
      nextPayload.numero_orden_compra = '';
      nextPayload.fecha_orden_compra = null;
    }
    await ordenesTrabajoService.crearOrdenTrabajo(nextPayload);
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

  const columns = [
    { key: 'codigo', label: 'Codigo' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'cliente_id', label: 'Cliente', render: (row) => clientes.find((cliente) => cliente.id === row.cliente_id)?.nombre || row.cliente_id },
    { key: 'producciones', label: 'Producciones', render: (row) => row.ordenes_produccion_count ?? row.producciones_count ?? '-' },
    { key: 'estado', label: 'Estado' },
  ];

  return (
    <div className="page-stack fade-in">
      <PageHeader title="Ordenes de Trabajo" subtitle="Flujo completo Cliente -> OrdenTrabajo -> OrdenProduccion" />

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Ordenes de trabajo</h2>
            <p>{ordenes.length} registros cargados</p>
          </div>
          <div className="section-actions">
            <Button variant="outline" onClick={loadInitial} disabled={loading}>Reintentar</Button>
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

      {selected && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Detalle: {selected.nombre || selected.codigo}</h2>
              <p>Cliente #{selected.cliente_id} - {producciones.length} ordenes de produccion asociadas</p>
            </div>
            <div className="section-actions">
              <Button variant="outline" onClick={() => loadDetail(selected)} disabled={detailLoading}>Reintentar detalle</Button>
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
        </section>
      )}

      {showForm && (
        <CrudFormModal
          title="Nueva orden de trabajo"
          fields={fields}
          onClose={() => setShowForm(false)}
          onSubmit={handleCrearOrden}
          validate={(values) => {
            if (!values.cliente_id) return 'Selecciona un cliente.';
            if (!values.nombre?.trim()) return 'El nombre es obligatorio.';
            return '';
          }}
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
