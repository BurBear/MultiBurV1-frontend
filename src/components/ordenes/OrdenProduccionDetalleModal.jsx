import { useEffect, useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import {
  compararPrediccionReal,
  generarPrediccionOrdenProduccion,
  obtenerPrediccionesPorOrdenProduccion,
} from '../../services/prediccionService';
import { formatDateTime, formatLocalDateTime } from '../../utils/datetime';
import { formatNumber, formatOrderCode, formatStatus, getStatusTone } from '../../utils/formatters';
import { getProcessArea } from '../../utils/procesos';

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function findById(items, id) {
  return asArray(items).find((item) => String(item.id) === String(id));
}

function getCatalogName(items, id, fallback = '-') {
  const item = findById(items, id);
  return item?.nombre || item?.codigo || fallback;
}

function formatCantidad(produccion) {
  const cantidad = formatNumber(produccion.cantidad);
  return produccion.demasia ? `${cantidad} + ${formatNumber(produccion.demasia)}` : cantidad;
}

function getProcesos(produccion) {
  return asArray(produccion?.procesos);
}

function getProcesoActual(produccion) {
  const procesos = getProcesos(produccion);
  return (
    procesos.find((proceso) => proceso.estado === 'EN_PROCESO')
    || procesos.find((proceso) => proceso.estado === 'PAUSADO')
    || procesos.find((proceso) => proceso.estado === 'PENDIENTE')
    || procesos[procesos.length - 1]
    || null
  );
}

function formatProcessQuantity(value) {
  if (value === null || value === undefined || value === '') return '-';
  return formatNumber(value);
}

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return '-';
  const total = Number(minutes || 0);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours <= 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

function confidenceLabel(value) {
  if (value === 'ALTA') return 'Confiabilidad alta';
  if (value === 'MEDIA') return 'Confiabilidad media';
  return 'Estimacion referencial';
}

function getRiskTone(value) {
  if (['A_TIEMPO', 'CONFIABLE', 'ACERTADA'].includes(value)) return 'success';
  if (['EN_RIESGO', 'REFERENCIAL'].includes(value)) return 'warning';
  if (['RETRASADO', 'DESVIADA'].includes(value)) return 'danger';
  return 'neutral';
}

function formatDifference(value) {
  if (value === null || value === undefined) return '-';
  const number = Number(value);
  if (Number.isNaN(number)) return '-';
  return `${number > 0 ? '+' : ''}${number} min`;
}

function PredictionPanel({
  predictions,
  loading,
  error,
  actionLoading,
  comparingId,
  canCompare,
  onRefresh,
  onGenerate,
  onCompare,
}) {
  const items = asArray(predictions);

  return (
    <section className="production-detail-panel prediction-panel prediction-detail-panel">
      <div className="prediction-panel-heading">
        <div>
          <h3>Predicciones IA</h3>
          <p>Historial de estimaciones guardadas para esta orden.</p>
        </div>
        <div className="prediction-panel-actions">
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={loading || actionLoading}
            aria-label="Actualizar predicciones"
            title="Actualizar predicciones"
          >
            &#x21bb;
          </Button>
          <Button
            type="button"
            onClick={onGenerate}
            disabled={loading || actionLoading}
          >
            {actionLoading ? 'Generando...' : 'Generar prediccion IA'}
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="muted">Cargando predicciones...</p>
      ) : error ? (
        <div className="alert alert-warning">{error}</div>
      ) : items.length ? (
        <div className="prediction-history-list">
          {items.map((prediction) => {
            const breakdown = asArray(prediction.desglose_json);
            const isComparing = comparingId === prediction.id;
            return (
              <article key={prediction.id} className="prediction-history-card">
                <div className="prediction-history-card-heading">
                  <div>
                    <strong>Prediccion #{prediction.id}</strong>
                    <small>Calculada: {formatDateTime(prediction.fecha_calculo)}</small>
                  </div>
                  <div className="prediction-history-badges">
                    <Badge tone={getRiskTone(prediction.estado_riesgo)}>{formatStatus(prediction.estado_riesgo)}</Badge>
                    <Badge tone={prediction.confianza_general === 'BAJA' ? 'warning' : 'info'}>
                      {prediction.confianza_general}
                    </Badge>
                  </div>
                </div>

                <div className="prediction-summary">
                  <div>
                    <span>Estimada</span>
                    <strong>{formatDuration(prediction.duracion_estimada_minutos)}</strong>
                    <small>{prediction.duracion_estimada_minutos} min</small>
                  </div>
                  <div>
                    <span>Muestra</span>
                    <strong>{formatNumber(prediction.muestra_historica_total)}</strong>
                    <small>registros historicos</small>
                  </div>
                  <div>
                    <span>Sugerida</span>
                    <strong>{formatDateTime(prediction.fecha_hora_sugerida_entrega)}</strong>
                    <small>fecha IA</small>
                  </div>
                  <div>
                    <span>Real</span>
                    <strong>{formatDuration(prediction.duracion_real_minutos)}</strong>
                    <small>{prediction.duracion_real_minutos === null ? 'sin comparar' : `${prediction.duracion_real_minutos} min`}</small>
                  </div>
                  <div>
                    <span>Diferencia</span>
                    <strong>{formatDifference(prediction.diferencia_minutos)}</strong>
                    <small>real menos estimada</small>
                  </div>
                  <div>
                    <span>Confianza</span>
                    <strong>{prediction.confianza_general}</strong>
                    <small>{confidenceLabel(prediction.confianza_general)}</small>
                  </div>
                </div>

                {prediction.confianza_general === 'BAJA' && (
                  <p className="prediction-reference-message">
                    Prediccion referencial por falta de datos historicos suficientes.
                  </p>
                )}

                {prediction.criterio_usado && (
                  <p className="prediction-criteria">{prediction.criterio_usado}</p>
                )}

                {breakdown.length > 0 && (
                  <div className="prediction-breakdown">
                    <span>Desglose</span>
                    {breakdown.map((item) => (
                      <div key={`${prediction.id}-${item.tipo_proceso}`}>
                        <strong>{item.tipo_proceso}</strong>
                        <span>{formatDuration(item.duracion_estimada_minutos)} - {item.confianza} - {item.muestra_historica} historicos</span>
                      </div>
                    ))}
                  </div>
                )}

                {canCompare && prediction.duracion_real_minutos === null && (
                  <div className="prediction-history-actions">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onCompare(prediction.id)}
                      disabled={isComparing || actionLoading}
                    >
                      {isComparing ? 'Comparando...' : 'Comparar con duracion real'}
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state compact">
          No existen predicciones registradas para esta orden de produccion.
        </div>
      )}
    </section>
  );
}

function DetailItem({ label, value, helper }) {
  return (
    <div className="production-detail-item">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
      {helper && <small>{helper}</small>}
    </div>
  );
}

function ProcessTimeline({ procesos }) {
  if (!procesos.length) {
    return <div className="empty-state compact">No hay procesos registrados para esta orden.</div>;
  }

  return (
    <div className="production-process-timeline">
      {procesos.map((proceso, index) => (
        <article key={proceso.id || `${proceso.tipo_proceso}-${index}`} className="production-process-step">
          <div className="production-process-step-main">
            <span className="production-process-number">{index + 1}</span>
            <div>
              <strong>{proceso.tipo_proceso || '-'}</strong>
              <small>{getProcessArea(proceso) || '-'}</small>
            </div>
            <Badge tone={getStatusTone(proceso.estado)}>{formatStatus(proceso.estado)}</Badge>
          </div>
          <dl className="production-process-step-meta">
            <div>
              <dt>Inicio</dt>
              <dd>{formatDateTime(proceso.fecha_inicio)}</dd>
            </div>
            <div>
              <dt>Fin</dt>
              <dd>{formatDateTime(proceso.fecha_fin)}</dd>
            </div>
            <div>
              <dt>Buena</dt>
              <dd>{formatProcessQuantity(proceso.cantidad_buena)}</dd>
            </div>
            <div>
              <dt>Mala</dt>
              <dd>{formatProcessQuantity(proceso.cantidad_mala)}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

export default function OrdenProduccionDetalleModal({
  produccion,
  clientes = [],
  materiales = [],
  formatos = [],
  maquinas = [],
  loading = false,
  error = '',
  printLoading = false,
  canAnular = false,
  onClose,
  onRefresh,
  onPrint,
  onAnular,
}) {
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionActionLoading, setPredictionActionLoading] = useState(false);
  const [predictionCompareId, setPredictionCompareId] = useState(null);
  const [predictionError, setPredictionError] = useState('');

  const loadPredictions = async () => {
    if (!produccion?.id) return;
    setPredictionLoading(true);
    setPredictionError('');
    try {
      const result = await obtenerPrediccionesPorOrdenProduccion(produccion.id);
      setPredictionHistory(asArray(result));
    } catch (err) {
      setPredictionError(err.message || 'No se pudieron cargar las predicciones IA.');
      setPredictionHistory([]);
    } finally {
      setPredictionLoading(false);
    }
  };

  const handleGeneratePrediction = async () => {
    if (!produccion?.id) return;
    setPredictionActionLoading(true);
    setPredictionError('');
    try {
      await generarPrediccionOrdenProduccion(produccion.id);
      await loadPredictions();
    } catch (err) {
      setPredictionError(err.message || 'No se pudo generar la prediccion IA.');
    } finally {
      setPredictionActionLoading(false);
    }
  };

  const handleComparePrediction = async (predictionId) => {
    setPredictionCompareId(predictionId);
    setPredictionError('');
    try {
      await compararPrediccionReal(predictionId);
      await loadPredictions();
    } catch (err) {
      setPredictionError(err.message || 'No se pudo comparar la prediccion con la duracion real.');
    } finally {
      setPredictionCompareId(null);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPredictions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produccion?.id]);

  if (!produccion) return null;

  const procesos = getProcesos(produccion);
  const procesoActual = getProcesoActual(produccion);
  const cliente = findById(clientes, produccion.cliente_id);
  const acabados = procesos.filter((proceso) => getProcessArea(proceso) === 'ACABADOS');

  return (
    <Modal
      title={`Detalle: ${formatOrderCode('OP', produccion.codigo, produccion.id)}`}
      onClose={onClose}
      panelClassName="modal-panel-wide production-detail-modal"
      headerMeta={<Badge tone={getStatusTone(produccion.estado)}>{formatStatus(produccion.estado)}</Badge>}
    >
      {loading ? (
        <p className="muted">Cargando detalle...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          <div className="production-detail-hero">
            <div className="production-detail-identity">
              <span>Orden de produccion</span>
              <strong>{formatOrderCode('OP', produccion.codigo, produccion.id)}</strong>
              <p>{produccion.descripcion || 'Sin descripcion'}</p>
            </div>
            <div className="production-detail-actions">
              {onRefresh && (
                <Button
                  variant="outline"
                  onClick={() => onRefresh(produccion)}
                  disabled={loading}
                  aria-label="Refrescar detalle"
                  title="Refrescar detalle"
                >
                  &#x21bb;
                </Button>
              )}
              {onPrint && (
                <Button
                  onClick={() => onPrint(produccion)}
                  disabled={loading || printLoading}
                >
                  {printLoading ? 'Preparando...' : 'Imprimir'}
                </Button>
              )}
              {onAnular && (
                <Button
                  variant="danger-outline"
                  onClick={() => onAnular(produccion)}
                  disabled={loading || !canAnular}
                  title={canAnular ? 'Anular orden de produccion' : 'Solo se puede anular una OP pendiente y sin procesos iniciados.'}
                >
                  Anular
                </Button>
              )}
            </div>
          </div>

          <div className="production-detail-strip">
            <DetailItem label="Cliente" value={cliente?.nombre || `Cliente #${produccion.cliente_id}`} helper={cliente?.documento || 'Sin documento'} />
            <DetailItem label="Entrega" value={formatLocalDateTime(produccion.fecha_entrega_estimada)} />
            <DetailItem label="Cantidad" value={formatCantidad(produccion)} />
            <div className="production-detail-item">
              <span>Proceso actual</span>
              <strong>{procesoActual?.tipo_proceso || '-'}</strong>
              {procesoActual && <Badge tone={getStatusTone(procesoActual.estado)}>{formatStatus(procesoActual.estado)}</Badge>}
            </div>
          </div>

          <div className="production-detail-layout">
            <section className="production-detail-panel">
              <h3>Datos generales</h3>
              <div className="production-detail-fields">
                <DetailItem label="Estado" value={<Badge tone={getStatusTone(produccion.estado)}>{formatStatus(produccion.estado)}</Badge>} />
                <DetailItem label="Orden de trabajo" value={produccion.orden_trabajo_id ? `OT #${produccion.orden_trabajo_id}` : '-'} />
                <DetailItem label="Origen" value={formatStatus(produccion.tipo_origen)} helper={`Servicio: ${formatStatus(produccion.tipo_servicio)}`} />
                <DetailItem label="Creacion" value={formatDateTime(produccion.created_at)} helper={`Usuario #${produccion.user_id || '-'}`} />
              </div>
            </section>

            <section className="production-detail-panel">
              <h3>Ficha tecnica</h3>
              <div className="production-detail-fields">
                <DetailItem label="Formato" value={getCatalogName(formatos, produccion.formato_id)} helper={getCatalogName(materiales, produccion.material_id)} />
                <DetailItem label="Maquina" value={getCatalogName(maquinas, produccion.maquina_id, 'Sin maquina')} />
                <DetailItem label="Impresion" value={produccion.tipo_impresion || '-'} />
                <DetailItem label="Color" value={produccion.modo_color || '-'} />
              </div>
            </section>
          </div>

          <PredictionPanel
            predictions={predictionHistory}
            loading={predictionLoading}
            error={predictionError}
            actionLoading={predictionActionLoading}
            comparingId={predictionCompareId}
            canCompare={produccion.estado === 'TERMINADO'}
            onRefresh={loadPredictions}
            onGenerate={handleGeneratePrediction}
            onCompare={handleComparePrediction}
          />

          <section className="production-detail-panel">
            <div className="production-detail-panel-heading">
              <div>
                <h3>Ruta de procesos</h3>
                <p>{procesos.length} procesos registrados</p>
              </div>
            </div>
            <div className="production-route-list">
              {procesos.length ? procesos.map((proceso, index) => (
                <Badge key={proceso.id || `${proceso.tipo_proceso}-${index}`} tone={getStatusTone(proceso.estado)}>
                  {index + 1}. {proceso.tipo_proceso}
                </Badge>
              )) : (
                <span className="muted">Sin ruta registrada</span>
              )}
            </div>
            <ProcessTimeline procesos={procesos} />
          </section>

          <section className="production-detail-panel">
            <div className="production-detail-panel-heading">
              <div>
                <h3>Acabados</h3>
                <p>{acabados.length ? 'Ruta definida para acabados' : 'Sin acabados configurados'}</p>
              </div>
            </div>
            <div className="production-route-list">
              {acabados.length ? acabados.map((proceso, index) => (
                <Badge key={proceso.id || `${proceso.tipo_proceso}-${index}`} tone={getStatusTone(proceso.estado)}>
                  {index + 1}. {proceso.tipo_proceso}
                </Badge>
              )) : (
                <span className="muted">No aplica.</span>
              )}
            </div>
          </section>
        </>
      )}
    </Modal>
  );
}
