import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { formatLocalDateTime } from '../../utils/datetime';
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
              <dd>{formatLocalDateTime(proceso.fecha_inicio)}</dd>
            </div>
            <div>
              <dt>Fin</dt>
              <dd>{formatLocalDateTime(proceso.fecha_fin)}</dd>
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
                <DetailItem label="Creacion" value={formatLocalDateTime(produccion.created_at)} helper={`Usuario #${produccion.user_id || '-'}`} />
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
