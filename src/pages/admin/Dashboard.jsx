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
import * as prediccionService from '../../services/prediccionService';
import {
  formatDateTime,
  formatLocalDateTime,
  getApiDateTimeValue,
  getLocalDateTimeValue,
} from '../../utils/datetime';
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

function getProduccionStatus(produccion) {
  const procesos = asArray(produccion.procesos);
  if (!procesos.length) return produccion.estado || 'PENDIENTE';
  if (procesos.every((proceso) => proceso.estado === 'TERMINADO')) return 'TERMINADO';
  if (procesos.some((proceso) => proceso.estado === 'EN_PROCESO')) return 'EN_PROCESO';
  if (procesos.some((proceso) => proceso.estado === 'PAUSADO')) return 'PAUSADO';
  return produccion.estado || 'PENDIENTE';
}

function getJuegosImpresion(produccion) {
  return asArray(produccion?.juegos_impresion);
}

function usesPlateGames(tipoImpresion) {
  return String(tipoImpresion || '').trim().toUpperCase() === 'T+R';
}

function procesoTieneJuegosImpresion(produccion, proceso) {
  if (!usesPlateGames(produccion?.tipo_impresion)) return false;
  const juegos = getJuegosImpresion(produccion);
  return juegos.some((juego) => String(juego.proceso_id) === String(proceso.id));
}

function getJuegoProcesoLabel(juego) {
  if (juego.codigo_lado) return juego.codigo_lado;
  if (juego.lado) return juego.lado;
  return 'JUEGO DE PLACAS';
}

function formatDuration(minutes) {
  const total = Number(minutes || 0);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours <= 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

function emptyTendencias() {
  return {
    procesos_frecuentes: [],
    materiales_frecuentes: [],
    promedio_duracion_por_proceso: [],
    cantidad_registros: 0,
  };
}

function getPredictionStatus(prediction) {
  return prediction.estado_riesgo || prediction.estado || 'REFERENCIAL';
}

function getPredictionConfidence(prediction) {
  return prediction.confianza_general || prediction.confianza || 'BAJA';
}

function getPredictionRiskTone(status) {
  if (['RETRASADO', 'DESVIADA'].includes(status)) return 'danger';
  if (['EN_RIESGO', 'REFERENCIAL'].includes(status)) return 'warning';
  if (['A_TIEMPO', 'CONFIABLE', 'ACERTADA'].includes(status)) return 'success';
  return 'neutral';
}

function getConfidenceTone(confidence) {
  if (confidence === 'ALTA') return 'success';
  if (confidence === 'MEDIA') return 'info';
  return 'warning';
}

function formatSignedMinutes(value) {
  if (value === null || value === undefined || value === '') return '-';
  const number = Number(value);
  if (!Number.isFinite(number)) return '-';
  if (number === 0) return '0 min';
  return `${number > 0 ? '+' : ''}${number} min`;
}

export default function Dashboard() {
  const [data, setData] = useState({
    clientes: [],
    materiales: [],
    maquinas: [],
    ordenesTrabajo: [],
    ordenesProduccion: [],
    incidencias: [],
    tendencias: emptyTendencias(),
    predicciones: [],
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
      ['tendencias', prediccionService.obtenerTendenciasProduccion()],
      ['predicciones', prediccionService.listarPredicciones()],
    ];

    const results = await Promise.allSettled(requests.map(([, request]) => request));
    const nextData = {};
    const nextErrors = [];

    results.forEach((result, index) => {
      const key = requests[index][0];
      if (result.status === 'fulfilled') {
        nextData[key] = key === 'tendencias'
          ? result.value || emptyTendencias()
          : asArray(result.value);
      } else {
        nextData[key] = key === 'tendencias' ? emptyTendencias() : [];
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
    const activeProcesses = producciones.flatMap((produccion) => (
      asArray(produccion.procesos)
        .filter((proceso) => proceso.estado === ACTIVE_PROCESS_STATE)
        .filter((proceso) => !procesoTieneJuegosImpresion(produccion, proceso))
    ));
    const activeJuegos = producciones.flatMap((produccion) => (
      usesPlateGames(produccion.tipo_impresion)
        ? getJuegosImpresion(produccion).filter((juego) => juego.estado === ACTIVE_PROCESS_STATE)
        : []
    ));
    const incidenciasAbiertas = data.incidencias.filter((incidencia) => incidencia.estado !== 'RESUELTA').length;

    return {
      clientesActivos: data.clientes.filter((item) => item.estado !== 'INACTIVO').length,
      ordenesTrabajo: data.ordenesTrabajo.length,
      ordenesProduccion: producciones.length,
      operadoresActivos: activeProcesses.length + activeJuegos.length,
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
    const produccionesById = indexById(data.ordenesProduccion);
    const now = new Date();

    const actividadProcesos = data.ordenesProduccion.flatMap((produccion) => (
      asArray(produccion.procesos)
        .filter((proceso) => proceso.estado === ACTIVE_PROCESS_STATE && proceso.operador_id)
        .filter((proceso) => !procesoTieneJuegosImpresion(produccion, proceso))
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
    ));

    const actividadJuegos = data.ordenesProduccion.flatMap((produccion) => (
      (usesPlateGames(produccion.tipo_impresion) ? getJuegosImpresion(produccion) : [])
        .filter((juego) => juego.estado === ACTIVE_PROCESS_STATE && juego.operador_id)
        .map((juego) => ({
          id: `${produccion.id}-juego-${juego.id}`,
          operador: juego.operador_nombre || `Usuario #${juego.operador_id}`,
          rol: 'IMPRESION',
          proceso: getJuegoProcesoLabel(juego),
          orden: formatOrderCode('OP', produccion.codigo, produccion.id),
          trabajo: produccion.descripcion || 'Sin descripcion',
          cliente: clientesById[produccion.cliente_id]?.nombre || `Cliente #${produccion.cliente_id}`,
          maquina: maquinasById[produccion.maquina_id]?.nombre || 'Sin maquina',
          inicio: juego.fecha_inicio,
        }))
    ));

    const actividad = [...actividadProcesos, ...actividadJuegos]
      .sort((a, b) => getApiDateTimeValue(a.inicio) - getApiDateTimeValue(b.inicio));

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
        vencida: getLocalDateTimeValue(orden.fecha_entrega_estimada) < now.getTime(),
      }))
      .sort((a, b) => getLocalDateTimeValue(a.entrega) - getLocalDateTimeValue(b.entrega))
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
        vencida: getLocalDateTimeValue(produccion.fecha_entrega_estimada) < now.getTime(),
      }))
      .sort((a, b) => getLocalDateTimeValue(a.entrega) - getLocalDateTimeValue(b.entrega))
      .slice(0, 6);

    const predictionRows = data.predicciones
      .map((prediction) => {
        const produccion = produccionesById[prediction.orden_produccion_id];
        const cliente = clientesById[prediction.cliente_id || produccion?.cliente_id];
        return {
          id: prediction.id,
          op: produccion
            ? formatOrderCode('OP', produccion.codigo, produccion.id)
            : `OP #${prediction.orden_produccion_id || '-'}`,
          trabajo: produccion?.descripcion || 'Orden de produccion',
          cliente: cliente?.nombre || (prediction.cliente_id ? `Cliente #${prediction.cliente_id}` : '-'),
          riesgo: getPredictionStatus(prediction),
          confianza: getPredictionConfidence(prediction),
          estimado: Number(prediction.duracion_estimada_minutos || 0),
          real: prediction.duracion_real_minutos,
          diferencia: prediction.diferencia_minutos,
          sugerida: prediction.fecha_hora_sugerida_entrega,
          calculada: prediction.fecha_calculo,
        };
      })
      .sort((a, b) => getApiDateTimeValue(b.calculada) - getApiDateTimeValue(a.calculada));

    const riesgoRows = predictionRows.filter((prediction) => (
      ['EN_RIESGO', 'RETRASADO', 'REFERENCIAL', 'DESVIADA'].includes(prediction.riesgo)
    ));
    const comparadas = predictionRows.filter((prediction) => (
      prediction.real !== null && prediction.real !== undefined
      && prediction.diferencia !== null && prediction.diferencia !== undefined
    ));
    const desviacionPromedio = comparadas.length
      ? Math.round(
        comparadas.reduce((total, prediction) => total + Math.abs(Number(prediction.diferencia || 0)), 0)
        / comparadas.length
      )
      : null;
    const confiables = predictionRows.filter((prediction) => (
      ['ALTA', 'MEDIA'].includes(prediction.confianza)
    )).length;
    const referenciales = predictionRows.filter((prediction) => (
      prediction.confianza === 'BAJA' || prediction.riesgo === 'REFERENCIAL'
    )).length;

    return {
      actividad,
      estadosProduccion: Object.entries(estadosProduccion).map(([estado, total]) => ({ estado, total })),
      cargaPorArea: Object.values(cargaPorArea),
      proximasEntregasTrabajo,
      proximasEntregasProduccion,
      tendenciaPredictiva: {
        registros: Number(data.tendencias?.cantidad_registros || 0),
        predicciones: predictionRows.length,
        riesgos: riesgoRows.length,
        confiables,
        referenciales,
        comparadas: comparadas.length,
        desviacionPromedio,
        riesgoRows: riesgoRows.slice(0, 4),
        recientes: predictionRows.slice(0, 4),
        procesoTop: asArray(data.tendencias?.procesos_frecuentes)[0]?.tipo_proceso || '-',
        promedioTop: asArray(data.tendencias?.promedio_duracion_por_proceso)[0]?.promedio_minutos || 0,
        nivelDatos: Number(data.tendencias?.cantidad_registros || 0) >= 10
          ? 'Historial alto'
          : Number(data.tendencias?.cantidad_registros || 0) >= 4
            ? 'Historial medio'
            : 'Historial bajo',
      },
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
                  <small className="dashboard-live-start">Inicio: {formatDateTime(item.inicio)}</small>
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

      <section className="panel dashboard-ai-panel">
        <div className="section-heading">
          <div>
            <h2>IA predictiva</h2>
            <p>Riesgo, confianza y comparacion entre tiempos estimados y reales.</p>
          </div>
          <Badge tone={dashboardData.tendenciaPredictiva.riesgos > 0 ? 'warning' : 'success'}>
            {dashboardData.tendenciaPredictiva.riesgos > 0 ? 'Revisar riesgos' : 'Sin alertas criticas'}
          </Badge>
        </div>

        <div className="dashboard-ai-grid">
          <div>
            <span>Predicciones guardadas</span>
            <strong>{formatNumber(dashboardData.tendenciaPredictiva.predicciones)}</strong>
            <small>{formatNumber(dashboardData.tendenciaPredictiva.registros)} procesos historicos</small>
          </div>
          <div>
            <span>En riesgo o referenciales</span>
            <strong>{formatNumber(dashboardData.tendenciaPredictiva.riesgos)}</strong>
            <small>{formatNumber(dashboardData.tendenciaPredictiva.referenciales)} con confianza baja</small>
          </div>
          <div>
            <span>Confiabilidad util</span>
            <strong>{formatNumber(dashboardData.tendenciaPredictiva.confiables)}</strong>
            <small>Predicciones con confianza alta o media</small>
          </div>
          <div>
            <span>Desviacion media</span>
            <strong>{dashboardData.tendenciaPredictiva.desviacionPromedio === null ? '-' : formatDuration(dashboardData.tendenciaPredictiva.desviacionPromedio)}</strong>
            <small>{formatNumber(dashboardData.tendenciaPredictiva.comparadas)} predicciones comparadas</small>
          </div>
        </div>

        {dashboardData.tendenciaPredictiva.predicciones === 0 ? (
          <div className="empty-state compact">
            <strong>Sin predicciones registradas</strong>
            <p>Genera predicciones IA desde el detalle de una orden de produccion para alimentar este tablero.</p>
          </div>
        ) : (
          <div className="dashboard-ai-columns">
            <div>
              <h3>Alertas IA</h3>
              {dashboardData.tendenciaPredictiva.riesgoRows.length === 0 ? (
                <p className="muted">No hay predicciones marcadas como riesgo o referenciales.</p>
              ) : (
                <div className="dashboard-ai-list">
                  {dashboardData.tendenciaPredictiva.riesgoRows.map((prediction) => (
                    <article key={prediction.id}>
                      <div>
                        <strong>{prediction.op}</strong>
                        <span>{prediction.cliente}</span>
                      </div>
                      <Badge tone={getPredictionRiskTone(prediction.riesgo)}>{formatStatus(prediction.riesgo)}</Badge>
                      <small>Entrega sugerida: {formatDateTime(prediction.sugerida)}</small>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3>Ultimas predicciones</h3>
              <div className="dashboard-ai-list">
                {dashboardData.tendenciaPredictiva.recientes.map((prediction) => (
                  <article key={prediction.id}>
                    <div>
                      <strong>{prediction.op}</strong>
                      <span>{formatDuration(prediction.estimado)} estimados</span>
                    </div>
                    <Badge tone={getConfidenceTone(prediction.confianza)}>{prediction.confianza}</Badge>
                    <small>Diferencia real: {formatSignedMinutes(prediction.diferencia)}</small>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
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

          <div className="dashboard-predictive-summary">
            <h3>Resumen predictivo</h3>
            <div className="dashboard-predictive-grid">
              <div>
                <span>Historico IA</span>
                <strong>{formatNumber(dashboardData.tendenciaPredictiva.registros)}</strong>
                <small>{dashboardData.tendenciaPredictiva.nivelDatos}</small>
              </div>
              <div>
                <span>Proceso frecuente</span>
                <strong>{dashboardData.tendenciaPredictiva.procesoTop}</strong>
                <small>Procesos terminados</small>
              </div>
              <div>
                <span>Promedio base</span>
                <strong>{formatDuration(dashboardData.tendenciaPredictiva.promedioTop)}</strong>
                <small>Primer proceso con muestra</small>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
