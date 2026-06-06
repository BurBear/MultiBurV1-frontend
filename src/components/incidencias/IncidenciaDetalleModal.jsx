import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import IncidenciaEstadoBadge from './IncidenciaEstadoBadge';
import IncidenciaTimeline from './IncidenciaTimeline';
import { formatDateTime } from '../../utils/datetime';
import { formatOrderCode } from '../../utils/formatters';
import { formatIncidenciaValue } from '../../utils/incidencias';

function getOrdenLabel(incidencia) {
  if (incidencia.orden_produccion_id) return formatOrderCode('OP', incidencia.orden_produccion_codigo, incidencia.orden_produccion_id);
  if (incidencia.orden_id || incidencia.orden_trabajo_id) return formatOrderCode('OT', incidencia.orden_codigo, incidencia.orden_id || incidencia.orden_trabajo_id);
  return '-';
}

function getProcesoLabel(incidencia) {
  return incidencia.tipo_proceso || incidencia.proceso_nombre || '-';
}

export default function IncidenciaDetalleModal({
  incidencia,
  historial = [],
  historialLoading = false,
  onClose,
  onRefreshHistorial,
}) {
  if (!incidencia) return null;

  return (
    <Modal
      title={`Incidencia #${incidencia.id}`}
      onClose={onClose}
      panelClassName="modal-panel-wide"
      headerMeta={<IncidenciaEstadoBadge value={incidencia.estado} />}
    >
      <div className="form-stack">
        <div className="detail-grid">
          <Card className="detail-card">
            <span>Orden</span>
            <strong>{getOrdenLabel(incidencia)}</strong>
          </Card>
          <Card className="detail-card">
            <span>Proceso</span>
            <strong>{getProcesoLabel(incidencia)}</strong>
          </Card>
          <Card className="detail-card">
            <span>Tipo</span>
            <strong>{formatIncidenciaValue(incidencia.tipo)}</strong>
          </Card>
          <Card className="detail-card">
            <span>Prioridad</span>
            <IncidenciaEstadoBadge value={incidencia.prioridad} type="prioridad" />
          </Card>
          <Card className="detail-card">
            <span>Creacion</span>
            <strong>{formatDateTime(incidencia.fecha_registro || incidencia.fecha_creacion || incidencia.created_at)}</strong>
          </Card>
          <Card className="detail-card">
            <span>Cierre</span>
            <strong>{formatDateTime(incidencia.fecha_cierre || incidencia.closed_at)}</strong>
          </Card>
        </div>

        <section className="subsection">
          <h3>Descripcion</h3>
          <p>{incidencia.descripcion || 'Sin descripcion'}</p>
        </section>

        {(incidencia.observacion_cierre || incidencia.resolucion) && (
          <section className="subsection">
            <h3>Resolucion</h3>
            <p>{incidencia.observacion_cierre || incidencia.resolucion}</p>
          </section>
        )}

        <section className="subsection">
          <div className="section-heading">
            <div>
              <h3>Historial</h3>
              <p>Eventos registrados por el backend</p>
            </div>
            <Button
              className="icon-button"
              variant="outline"
              onClick={onRefreshHistorial}
              disabled={historialLoading}
              aria-label="Refrescar historial"
              title="Refrescar historial"
            >
              {'R'}
            </Button>
          </div>
          <IncidenciaTimeline historial={historial} loading={historialLoading} />
        </section>
      </div>
    </Modal>
  );
}
