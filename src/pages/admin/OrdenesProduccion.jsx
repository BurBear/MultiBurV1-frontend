import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import CrudTable from '../../components/crud/CrudTable';
import OrdenProduccionFormModal from '../../components/ordenes/OrdenProduccionFormModal';
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

export default function OrdenesProduccion() {
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

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

  const columns = [
    { key: 'codigo', label: 'Codigo', render: (row) => formatOrderCode('OP', row.codigo, row.id) },
    { key: 'descripcion', label: 'Descripcion' },
    { key: 'fecha_entrega_estimada', label: 'Entrega', render: (row) => formatLocalDateTime(row.fecha_entrega_estimada) },
    { key: 'cliente_id', label: 'Cliente', render: (row) => clientes.find((cliente) => cliente.id === row.cliente_id)?.nombre || row.cliente_id },
    { key: 'orden_trabajo_id', label: 'Orden trabajo' },
    { key: 'tipo_origen', label: 'Origen' },
    { key: 'tipo_servicio', label: 'Servicio' },
    { key: 'estado', label: 'Estado' },
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
              ↻
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
    </div>
  );
}
