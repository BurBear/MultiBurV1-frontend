import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import SummaryCard from '../../components/dashboard/SummaryCard';
import * as clientesService from '../../services/clientesService';
import * as materialesService from '../../services/materialesService';
import * as maquinasService from '../../services/maquinasService';
import * as ordenesTrabajoService from '../../services/ordenesTrabajoService';
import * as ordenesProduccionService from '../../services/ordenesProduccionService';

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export default function Dashboard() {
  const [data, setData] = useState({
    clientes: [],
    materiales: [],
    maquinas: [],
    ordenesTrabajo: [],
    ordenesProduccion: [],
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  const loadDashboard = async () => {
    setLoading(true);
    setErrors([]);

    const requests = [
      ['clientes', clientesService.listar()],
      ['materiales', materialesService.listar()],
      ['maquinas', maquinasService.listar()],
      ['ordenesTrabajo', ordenesTrabajoService.listarOrdenesTrabajo()],
      ['ordenesProduccion', ordenesProduccionService.listarOrdenesProduccion()],
    ];

    const results = await Promise.allSettled(requests.map(([, request]) => request));
    const nextData = {};
    const nextErrors = [];

    results.forEach((result, index) => {
      const key = requests[index][0];
      if (result.status === 'fulfilled') {
        nextData[key] = asArray(result.value);
      } else {
        nextData[key] = [];
        nextErrors.push(`${key}: ${result.reason?.message || 'error de carga'}`);
      }
    });

    setData(nextData);
    setErrors(nextErrors);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, []);

  const resumen = useMemo(() => {
    const producciones = data.ordenesProduccion;
    return {
      clientesActivos: data.clientes.filter((item) => item.estado !== 'INACTIVO').length,
      ordenesTrabajo: data.ordenesTrabajo.length,
      ordenesProduccion: producciones.length,
      produccionesServicio: producciones.filter((item) => item.tipo_origen === 'SERVICIO' || !item.orden_trabajo_id).length,
      produccionesTrabajo: producciones.filter((item) => item.tipo_origen === 'COMPLETO' || item.orden_trabajo_id).length,
      materialesActivos: data.materiales.filter((item) => item.estado !== 'INACTIVO').length,
      maquinasActivas: data.maquinas.filter((item) => item.estado !== 'INACTIVO').length,
    };
  }, [data]);

  return (
    <div className="page-stack fade-in">
      <PageHeader title="Dashboard" subtitle="Resumen administrativo de catalogos y ordenes" />

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Indicadores</h2>
            <p>{loading ? 'Cargando datos...' : 'Datos sincronizados con el backend'}</p>
          </div>
          <Button variant="outline" onClick={loadDashboard} disabled={loading}>
            Reintentar
          </Button>
        </div>

        {errors.length > 0 && (
          <div className="alert alert-warning">
            Algunos datos no pudieron cargarse: {errors.join(' | ')}
          </div>
        )}

        <div className="summary-grid">
          <SummaryCard label="Clientes activos" value={loading ? '-' : resumen.clientesActivos} />
          <SummaryCard label="Ordenes de trabajo" value={loading ? '-' : resumen.ordenesTrabajo} />
          <SummaryCard label="Ordenes de produccion" value={loading ? '-' : resumen.ordenesProduccion} />
          <SummaryCard label="Producciones de servicio" value={loading ? '-' : resumen.produccionesServicio} />
          <SummaryCard label="Producciones asociadas" value={loading ? '-' : resumen.produccionesTrabajo} />
          <SummaryCard label="Materiales activos" value={loading ? '-' : resumen.materialesActivos} />
          <SummaryCard label="Maquinas activas" value={loading ? '-' : resumen.maquinasActivas} />
        </div>
      </section>
    </div>
  );
}
