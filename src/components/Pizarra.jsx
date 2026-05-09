import React from 'react';
import { apiFetch } from '../services/api';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Card from './ui/Card';
import { getStatusTone } from '../utils/formatters';
import { isAdmin } from '../utils/roles';

const columns = [
  { id: 'PENDIENTE', label: 'Pendientes' },
  { id: 'EN_PROCESO', label: 'En proceso' },
  { id: 'PAUSADO', label: 'Pausados' },
  { id: 'TERMINADO', label: 'Terminados' },
];

export default function Pizarra({ ordenes = [], area, recargar, user }) {
  const [actionLoading, setActionLoading] = React.useState(false);

  const handleAction = async (ordenId, tipoProceso, accion) => {
    setActionLoading(true);
    try {
      await apiFetch(`/ordenes/${ordenId}/procesos/${tipoProceso}/${accion}`, {
        method: 'PUT',
      });
      recargar();
    } catch (err) {
      alert(err.message || `Error al ${accion}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReabrir = async (ordenId, tipoProceso) => {
    setActionLoading(true);
    try {
      await apiFetch(`/ordenes/${ordenId}/procesos/${tipoProceso}/reabrir`, {
        method: 'PUT',
      });
      recargar();
    } catch (err) {
      alert(err.message || 'Error al reabrir proceso');
    } finally {
      setActionLoading(false);
    }
  };

  const misProcesos = ordenes.flatMap((orden) => {
    if (orden.estado === 'ANULADA') return [];
    const procesoEnMiArea = orden.procesos?.find((proceso) => proceso.tipo_proceso === area);
    if (!procesoEnMiArea) return [];

    return {
      ...procesoEnMiArea,
      orden_cliente: orden.cliente,
      orden_id: orden.id,
      orden_descripcion: orden.descripcion,
    };
  });

  const procesosPorEstado = columns.reduce((acc, column) => {
    acc[column.id] = misProcesos.filter((proceso) => proceso.estado === column.id);
    return acc;
  }, {});

  const ProcesoCard = ({ proc }) => {
    const orden = ordenes.find((item) => item.id === proc.orden_id);
    let puedeIniciar = true;
    let procesoAnterior = null;

    if (orden?.procesos) {
      const index = orden.procesos.findIndex((proceso) => proceso.id === proc.id);
      if (index > 0) {
        procesoAnterior = orden.procesos[index - 1];
        puedeIniciar = procesoAnterior.estado === 'TERMINADO';
      }
    }

    return (
      <Card className={`process-card process-${proc.estado.toLowerCase()}`}>
        <div className="process-card-header">
          <h4>Orden #{proc.orden_id}</h4>
          <Badge tone={getStatusTone(proc.estado)}>{proc.estado}</Badge>
        </div>
        <p className="process-client">{proc.orden_cliente}</p>
        <p className="process-description">{proc.orden_descripcion}</p>

        <div className="process-actions">
          {proc.estado === 'PENDIENTE' && (
            <Button
              size="sm"
              onClick={() => handleAction(proc.orden_id, proc.tipo_proceso, 'iniciar')}
              disabled={actionLoading || !puedeIniciar}
              title={!puedeIniciar ? `Esperando a que termine ${procesoAnterior?.tipo_proceso}` : ''}
            >
              {puedeIniciar ? 'Iniciar' : `Esperando ${procesoAnterior?.tipo_proceso}`}
            </Button>
          )}

          {proc.estado === 'EN_PROCESO' && (
            <>
              <Button
                variant="warning"
                size="sm"
                onClick={() => handleAction(proc.orden_id, proc.tipo_proceso, 'pausar')}
                disabled={actionLoading}
              >
                Pausar
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleAction(proc.orden_id, proc.tipo_proceso, 'finalizar')}
                disabled={actionLoading}
              >
                Finalizar
              </Button>
            </>
          )}

          {proc.estado === 'PAUSADO' && (
            <Button
              size="sm"
              onClick={() => handleAction(proc.orden_id, proc.tipo_proceso, 'reanudar')}
              disabled={actionLoading}
            >
              Reanudar
            </Button>
          )}

          {proc.estado === 'TERMINADO' && isAdmin(user) && (
            <Button
              variant="danger-outline"
              size="sm"
              onClick={() => handleReabrir(proc.orden_id, proc.tipo_proceso)}
              disabled={actionLoading}
            >
              Reabrir
            </Button>
          )}
        </div>
      </Card>
    );
  };

  if (misProcesos.length === 0) {
    return (
      <Card className="empty-state">
        <h2>No hay procesos para {area}</h2>
        <p>Cuando existan ordenes activas en esta estacion, apareceran en la pizarra.</p>
      </Card>
    );
  }

  return (
    <div className="kanban-board">
      {columns.map((column) => (
        <section key={column.id} className={`kanban-column column-${column.id.toLowerCase()}`}>
          <header className="kanban-column-header">
            <h3>{column.label}</h3>
            <Badge tone={getStatusTone(column.id)}>{procesosPorEstado[column.id].length}</Badge>
          </header>
          <div className="kanban-list">
            {procesosPorEstado[column.id].length === 0 ? (
              <p className="column-empty">Sin procesos</p>
            ) : (
              procesosPorEstado[column.id].map((proceso) => <ProcesoCard key={proceso.id} proc={proceso} />)
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
