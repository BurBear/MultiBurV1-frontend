import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SummaryCard from '../../components/dashboard/SummaryCard';
import * as clientesService from '../../services/clientesService';
import * as incidenciasService from '../../services/incidenciasService';
import * as materialesService from '../../services/materialesService';
import * as maquinasService from '../../services/maquinasService';
import * as ordenesTrabajoService from '../../services/ordenesTrabajoService';
import * as ordenesProduccionService from '../../services/ordenesProduccionService';
import { formatLocalDateTime } from '../../utils/datetime';
import { formatNumber, formatOrderCode, formatStatus, getStatusTone } from '../../utils/formatters';
import { getProcessArea } from '../../utils/procesos';

const REFRESH_INTERVAL_MS = 15000;
const ACTIVE_PROCESS_STATE = 'EN_PROCESO';

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function indexById(items) {
  return asArray(items).reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

function getDateValue(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : Number.MAX_SAFE_INTEGER;
}

function getProduccionStatus(produccion) {
  const procesos = asArray(produccion.procesos);
  if (!procesos.length) return produccion.estado || 'PENDIENTE';
  if (procesos.every((proceso) => proceso.estado === 'TERMINADO')) return 'TERMINADO';
  if (procesos.some((proceso) => proceso.estado === 'EN_PROCESO')) return 'EN_PROCESO';
  if (procesos.some((proceso) => proceso.estado === 'PAUSADO')) return 'PAUSADO';
  return produccion.estado || 'PENDIENTE';
}

export default function Dashboard() {
  const [data, setData] = useState({
    clientes: [],
    materiales: [],
    maquinas: [],
    ordenesTrabajo: [],
    ordenesProduccion: [],
    incidencias: [],
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [entregaTipo, setEntregaTipo] = useState('TRABAJO');

  const loadDashboard = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setErrors([]);

    const requests = [
      ['clientes', clientesService.listar()],
      ['materiales', materialesService.listar()],
      ['maquinas', maquinasService.listar()],
      ['ordenesTrabajo', ordenesTrabajoService.listarOrdenesTrabajo()],
      ['ordenesProduccion', ordenesProduccionService.listarOrdenesProduccion()],
      ['incidencias', incidenciasService.listarIncidencias()],
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
    setLastSync(new Date());
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
    const intervalId = window.setInterval(() => {
      loadDashboard({ silent: true });
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const resumen = useMemo(() => {
    const producciones = data.ordenesProduccion;
    const procesos = producciones.flatMap((produccion) => asArray(produccion.procesos));
    const activeProcesses = procesos.filter((proceso) => proceso.estado === ACTIVE_PROCESS_STATE);
    const incidenciasAbiertas = data.incidencias.filter((incidencia) => incidencia.estado !== 'RESUELTA').length;

    return {
      clientesActivos: data.clientes.filter((item) => item.estado !== 'INACTIVO').length,
      ordenesTrabajo: data.ordenesTrabajo.length,
      ordenesProduccion: producciones.length,
      operadoresActivos: activeProcesses.length,
      procesosPausados: procesos.filter((proceso) => proceso.estado === 'PAUSADO').length,
      incidenciasAbiertas,
      produccionesServicio: producciones.filter((item) => item.tipo_origen === 'SERVICIO' || !item.orden_trabajo_id).length,
      produccionesTrabajo: producciones.filter((item) => item.tipo_origen === 'COMPLETO' || item.orden_trabajo_id).length,
      materialesActivos: data.materiales.filter((item) => item.estado !== 'INACTIVO').length,
      maquinasActivas: data.maquinas.filter((item) => item.estado !== 'INACTIVO').length,
    };
  }, [data]);

  const dashboardData = useMemo(() => {
    const clientesById = indexById(data.clientes);
    const maquinasById = indexById(data.maquinas);
    const now = new Date();

    const actividad = data.ordenesProduccion.flatMap((produccion) => (
      asArray(produccion.procesos)
        .filter((proceso) => proceso.estado === ACTIVE_PROCESS_STATE && proceso.operador_id)
        .map((proceso) => ({
          id: `${produccion.id}-${proceso.id}`,
          operador: proceso.operador_nombre || `Usuario #${proceso.operador_id}`,
          rol: getProcessArea(proceso) || proceso.tipo_proceso,
          proceso: proceso.tipo_proceso,
          orden: formatOrderCode('OP', produccion.codigo, produccion.id),
          trabajo: produccion.descripcion || 'Sin descripcion',
          cliente: clientesById[produccion.cliente_id]?.nombre || `Cliente #${produccion.cliente_id}`,
          maquina: maquinasById[produccion.maquina_id]?.nombre || 'Sin maquina',
          inicio: proceso.fecha_inicio,
        }))
    )).sort((a, b) => getDateValue(a.inicio) - getDateValue(b.inicio));

    const estadosProduccion = data.ordenesProduccion.reduce((acc, produccion) => {
      const status = getProduccionStatus(produccion);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const cargaPorArea = data.ordenesProduccion
      .flatMap((produccion) => asArray(produccion.procesos))
      .filter((proceso) => proceso.estado !== 'TERMINADO')
      .reduce((acc, proceso) => {
        const area = getProcessArea(proceso) || 'SIN AREA';
        if (!acc[area]) {
          acc[area] = { area, pendientes: 0, enProceso: 0, pausados: 0 };
        }
        if (proceso.estado === 'EN_PROCESO') acc[area].enProceso += 1;
        else if (proceso.estado === 'PAUSADO') acc[area].pausados += 1;
        else acc[area].pendientes += 1;
        return acc;
      }, {});

    const proximasEntregasTrabajo = data.ordenesTrabajo
      .filter((orden) => !['ANULADA', 'ENTREGADA'].includes(orden.estado))
      .map((orden) => ({
        id: `OT-${orden.id}`,
        codigo: formatOrderCode('OT', orden.codigo, orden.id),
        trabajo: orden.nombre || orden.descripcion || 'Sin descripcion',
        cliente: clientesById[orden.cliente_id]?.nombre || `Cliente #${orden.cliente_id}`,
        estado: orden.estado || 'PENDIENTE',
        entrega: orden.fecha_entrega_estimada,
        vencida: getDateValue(orden.fecha_entrega_estimada) < now.getTime(),
      }))
      .sort((a, b) => getDateValue(a.entrega) - getDateValue(b.entrega))
      .slice(0, 6);

    const proximasEntregasProduccion = data.ordenesProduccion
      .filter((produccion) => produccion.estado !== 'ANULADA' && getProduccionStatus(produccion) !== 'TERMINADO')
      .map((produccion) => ({
        id: `OP-${produccion.id}`,
        codigo: formatOrderCode('OP', produccion.codigo, produccion.id),
        trabajo: produccion.descripcion || 'Sin descripcion',
        cliente: clientesById[produccion.cliente_id]?.nombre || `Cliente #${produccion.cliente_id}`,
        estado: getProduccionStatus(produccion),
        entrega: produccion.fecha_entrega_estimada,
        vencida: getDateValue(produccion.fecha_entrega_estimada) < now.getTime(),
      }))
      .sort((a, b) => getDateValue(a.entrega) - getDateValue(b.entrega))
      .slice(0, 6);

    return {
      actividad,
      estadosProduccion: Object.entries(estadosProduccion).map(([estado, total]) => ({ estado, total })),
      cargaPorArea: Object.values(cargaPorArea),
      proximasEntregasTrabajo,
      proximasEntregasProduccion,
    };
  }, [data]);

  const entregasActuales = entregaTipo === 'TRABAJO'
    ? dashboardData.proximasEntregasTrabajo
    : dashboardData.proximasEntregasProduccion;
  const entregasDescripcion = entregaTipo === 'TRABAJO'
    ? 'Ordenes de trabajo por entregar.'
    : 'Ordenes de produccion pendientes o en proceso.';
  const entregasEmptyText = entregaTipo === 'TRABAJO'
    ? 'No hay ordenes de trabajo abiertas con fecha de entrega.'
    : 'No hay ordenes de produccion abiertas con fecha de entrega.';

  return (
    <div className="page-stack fade-in">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Actividad en vivo</h2>
            <p>
              {loading
                ? 'Cargando actividad de operadores...'
                : `Procesos iniciados actualmente${lastSync ? ` - ${formatLocalDateTime(lastSync)}` : ''}`}
            </p>
          </div>
          <Button
            className="icon-button"
            variant="outline"
            onClick={() => loadDashboard()}
            disabled={loading}
            aria-label="Refrescar"
            title="Refrescar"
          >
            ↻
          </Button>
        </div>

        {errors.length > 0 && (
          <div className="alert alert-warning">
            Algunos datos no pudieron cargarse: {errors.join(' | ')}
          </div>
        )}

        {loading ? (
          <p className="muted">Cargando actividad...</p>
        ) : dashboardData.actividad.length === 0 ? (
          <div className="empty-state compact">
            <strong>Sin actividad en vivo</strong>
            <p>Cuando un operador inicie una orden, aparecera aqui en tiempo real.</p>
          </div>
        ) : (
          <>
            <div className="dashboard-live-count">
              <Badge tone="info">{dashboardData.actividad.length} en proceso</Badge>
            </div>
            <div className="dashboard-live-grid">
              {dashboardData.actividad.map((item) => (
                <article key={item.id} className="dashboard-live-card">
                  <div className="dashboard-live-card-header">
                    <span className="live-dot" />
                    <div>
                      <strong>{item.operador}</strong>
                      <small>{item.rol}</small>
                    </div>
                    <Badge tone="info">{item.proceso}</Badge>
                  </div>
                  <div className="dashboard-live-card-body">
                    <div>
                      <span>Orden</span>
                      <strong>{item.orden}</strong>
                    </div>
                    <div>
                      <span>Cliente</span>
                      <strong>{item.cliente}</strong>
                    </div>
                    <div>
                      <span>Trabajo</span>
                      <strong>{item.trabajo}</strong>
                    </div>
                    <div>
                      <span>Maquina</span>
                      <strong>{item.maquina}</strong>
                    </div>
                  </div>
                  <small className="dashboard-live-start">Inicio: {formatLocalDateTime(item.inicio)}</small>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Indicadores</h2>
            <p>Resumen general de ordenes, incidencias y recursos.</p>
          </div>
        </div>

        <div className="summary-grid">
          <SummaryCard label="Clientes activos" value={loading ? '-' : resumen.clientesActivos} />
          <SummaryCard label="Ordenes de trabajo" value={loading ? '-' : resumen.ordenesTrabajo} />
          <SummaryCard label="Ordenes de produccion" value={loading ? '-' : resumen.ordenesProduccion} />
          <SummaryCard label="Operadores en proceso" value={loading ? '-' : resumen.operadoresActivos} hint="Solo procesos iniciados" />
          <SummaryCard label="Procesos pausados" value={loading ? '-' : resumen.procesosPausados} />
          <SummaryCard label="Incidencias abiertas" value={loading ? '-' : resumen.incidenciasAbiertas} />
          <SummaryCard label="Materiales activos" value={loading ? '-' : resumen.materialesActivos} />
          <SummaryCard label="Maquinas activas" value={loading ? '-' : resumen.maquinasActivas} />
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Proximas entregas</h2>
              <p>{entregasDescripcion}</p>
            </div>
            <label className="dashboard-delivery-filter">
              <span>Tipo</span>
              <select value={entregaTipo} onChange={(event) => setEntregaTipo(event.target.value)}>
                <option value="TRABAJO">Ordenes de trabajo</option>
                <option value="PRODUCCION">Ordenes de produccion</option>
              </select>
            </label>
          </div>

          {entregasActuales.length === 0 ? (
            <div className="empty-state compact">
              <strong>Sin entregas pendientes</strong>
              <p>{entregasEmptyText}</p>
            </div>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="crud-table dashboard-table">
                <thead>
                  <tr>
                    <th>Orden</th>
                    <th>Cliente</th>
                    <th>Entrega</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {entregasActuales.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.codigo}</strong>
                        <small>{item.trabajo}</small>
                      </td>
                      <td>{item.cliente}</td>
                      <td>
                        <span className={item.vencida ? 'text-danger' : ''}>{formatLocalDateTime(item.entrega)}</span>
                      </td>
                      <td><Badge tone={getStatusTone(item.estado)}>{formatStatus(item.estado)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Estado operativo</h2>
              <p>Resumen de produccion y carga pendiente.</p>
            </div>
          </div>

          <div className="dashboard-status-list">
            {dashboardData.estadosProduccion.map((item) => (
              <div key={item.estado} className="dashboard-status-row">
                <span>{formatStatus(item.estado)}</span>
                <strong>{formatNumber(item.total)}</strong>
                <Badge tone={getStatusTone(item.estado)}>{item.estado}</Badge>
              </div>
            ))}
          </div>

          <div className="dashboard-area-load">
            <h3>Carga por area</h3>
            {dashboardData.cargaPorArea.length === 0 ? (
              <p className="muted">No hay procesos pendientes.</p>
            ) : (
              dashboardData.cargaPorArea.map((item) => (
                <div key={item.area} className="dashboard-area-row">
                  <strong>{item.area}</strong>
                  <span>{formatNumber(item.pendientes)} pendientes</span>
                  <span>{formatNumber(item.enProceso)} en proceso</span>
                  <span>{formatNumber(item.pausados)} pausados</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
