import { formatDateTime } from '../../utils/datetime';
import { formatIncidenciaValue } from '../../utils/incidencias';

function getTitle(item) {
  return item.accion || item.evento || item.estado || item.tipo || 'Cambio registrado';
}

export default function IncidenciaTimeline({ historial = [], loading = false }) {
  if (loading) {
    return <p className="muted">Cargando historial...</p>;
  }

  if (!historial.length) {
    return <div className="empty-state compact">No hay historial registrado para esta incidencia.</div>;
  }

  return (
    <div className="timeline-list">
      {historial.map((item, index) => (
        <article key={item.id || index} className="detail-card card">
          <span>{formatDateTime(item.fecha || item.created_at || item.fecha_evento)}</span>
          <strong>{formatIncidenciaValue(getTitle(item))}</strong>
          <p>{item.observacion || item.descripcion || item.detalle || 'Sin observacion'}</p>
          {(item.usuario_nombre || item.usuario_id || item.creado_por) && (
            <small>Usuario: {item.usuario_nombre || item.creado_por || item.usuario_id}</small>
          )}
        </article>
      ))}
    </div>
  );
}
