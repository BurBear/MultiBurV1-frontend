import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { formatNumber, formatStatus, getStatusTone } from '../../utils/formatters';

export default function OrdenCard({ orden }) {
  return (
    <Card className="orden-card">
      <div className="orden-card-header">
        <h3>{orden.cliente}</h3>
        <Badge tone={getStatusTone(orden.estado)}>{formatStatus(orden.estado)}</Badge>
      </div>
      <p className="orden-description">{orden.descripcion}</p>
      <dl className="orden-meta">
        <div>
          <dt>Cantidad</dt>
          <dd>{formatNumber(orden.cantidad)}</dd>
        </div>
        <div>
          <dt>Servicio</dt>
          <dd>{formatStatus(orden.tipo_servicio)}</dd>
        </div>
      </dl>
    </Card>
  );
}
