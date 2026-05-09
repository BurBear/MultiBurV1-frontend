import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import CrudTable from '../../components/crud/CrudTable';
import OrdenProduccionFormModal from '../../components/ordenes/OrdenProduccionFormModal';
import * as clientesService from '../../services/clientesService';
import * as materialesService from '../../services/materialesService';
import * as formatosService from '../../services/formatosService';
import * as maquinasService from '../../services/maquinasService';
import * as ordenesProduccionService from '../../services/ordenesProduccionService';

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

const filters = [
  { id: 'TODAS', label: 'Todas' },
  { id: 'SERVICIO', label: 'Servicio directo' },
  { id: 'COMPLETO', label: 'Asociadas a Orden de Trabajo' },
];

export default function OrdenesProduccion() {
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [activeFilter, setActiveFilter] = useState('TODAS');
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

  const filteredOrdenes = useMemo(() => {
    if (activeFilter === 'SERVICIO') {
      return ordenes.filter((orden) => orden.tipo_origen === 'SERVICIO' || !orden.orden_trabajo_id);
    }
    if (activeFilter === 'COMPLETO') {
      return ordenes.filter((orden) => orden.tipo_origen === 'COMPLETO' || orden.orden_trabajo_id);
    }
    return ordenes;
  }, [ordenes, activeFilter]);

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
    { key: 'id', label: 'ID' },
    { key: 'descripcion', label: 'Descripcion' },
    { key: 'cliente_id', label: 'Cliente', render: (row) => clientes.find((cliente) => cliente.id === row.cliente_id)?.nombre || row.cliente_id },
    { key: 'orden_trabajo_id', label: 'Orden trabajo' },
    { key: 'tipo_origen', label: 'Origen' },
    { key: 'tipo_servicio', label: 'Servicio' },
    { key: 'estado', label: 'Estado' },
  ];

  return (
    <div className="page-stack fade-in">
      <PageHeader title="Ordenes de Produccion" subtitle="Producciones internas y servicios directos" />

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Ordenes de produccion</h2>
            <p>{filteredOrdenes.length} registros visibles</p>
          </div>
          <div className="section-actions">
            <Button variant="outline" onClick={loadData} disabled={loading}>Reintentar</Button>
            <Button onClick={() => setShowForm(true)}>+ Servicio directo</Button>
          </div>
        </div>

        <div className="tabs compact-tabs">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              size="sm"
              variant={activeFilter === filter.id ? 'primary' : 'outline'}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <p className="muted">Cargando...</p>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <CrudTable columns={columns} rows={filteredOrdenes} />
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
