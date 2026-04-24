import React from 'react';
import { apiFetch } from '../services/api';

export default function Pizarra({ ordenes, area, recargar }) {
  const [actionLoading, setActionLoading] = React.useState(false);

  const handleAction = async (ordenId, tipoProceso, accion) => {
    setActionLoading(true);
    try {
      await apiFetch(`/ordenes/${ordenId}/procesos/${tipoProceso}/${accion}`, {
        method: 'PUT'
      });
      recargar(); // Recargar datos padre
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
        method: 'PUT'
      });
      recargar();
    } catch (err) {
      alert(err.message || "Error al reabrir proceso");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrar mis procesos
  const misProcesos = [];
  ordenes.forEach(orden => {
    if (orden.estado !== "ANULADA") {
      const procesoEnMiArea = orden.procesos.find(p => p.tipo_proceso === area);
      if (procesoEnMiArea) {
        misProcesos.push({
          ...procesoEnMiArea,
          orden_cliente: orden.cliente,
          orden_id: orden.id,
          orden_descripcion: orden.descripcion
        });
      }
    }
  });

  const pendientes = misProcesos.filter(p => p.estado === 'PENDIENTE');
  const enProceso = misProcesos.filter(p => p.estado === 'EN_PROCESO');
  const pausados = misProcesos.filter(p => p.estado === 'PAUSADO');
  const terminados = misProcesos.filter(p => p.estado === 'TERMINADO');

  const ProcesoCard = ({ proc }) => (
    <div className="card" style={{ marginBottom: '1rem', background: 'var(--bg-panel)', borderLeft: `4px solid ${proc.estado === 'EN_PROCESO' ? '#22c55e' : proc.estado === 'PAUSADO' ? '#eab308' : proc.estado === 'TERMINADO' ? '#64748b' : 'var(--border)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h4 style={{ margin: 0 }}>Orden #{proc.orden_id}</h4>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{proc.estado}</span>
      </div>
      <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{proc.orden_cliente}</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>{proc.orden_descripcion}</p>
      
      {/* Controles de Estado */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {proc.estado === 'PENDIENTE' && (
          <button onClick={() => handleAction(proc.orden_id, proc.tipo_proceso, 'iniciar')} disabled={actionLoading} style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}>
            ▶ Iniciar
          </button>
        )}
        
        {proc.estado === 'EN_PROCESO' && (
          <>
            <button onClick={() => handleAction(proc.orden_id, proc.tipo_proceso, 'pausar')} disabled={actionLoading} style={{ flex: 1, padding: '6px', fontSize: '0.8rem', background: '#eab308', color: '#000' }}>
              ⏸ Pausar
            </button>
            <button onClick={() => handleAction(proc.orden_id, proc.tipo_proceso, 'finalizar')} disabled={actionLoading} style={{ flex: 1, padding: '6px', fontSize: '0.8rem', background: '#22c55e' }}>
              ✔ Finalizar
            </button>
          </>
        )}

        {proc.estado === 'PAUSADO' && (
          <button onClick={() => handleAction(proc.orden_id, proc.tipo_proceso, 'reanudar')} disabled={actionLoading} style={{ flex: 1, padding: '6px', fontSize: '0.8rem', background: '#3b82f6' }}>
            ▶ Reanudar
          </button>
        )}

        {proc.estado === 'TERMINADO' && (
          <button onClick={() => handleReabrir(proc.orden_id, proc.tipo_proceso)} disabled={actionLoading} style={{ width: '100%', padding: '6px', fontSize: '0.8rem', background: 'transparent', border: '1px dashed var(--accent)', color: 'var(--accent)' }}>
            Reabrir
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem', alignItems: 'flex-start' }}>
      <div style={{ minWidth: '300px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          PENDIENTES <span style={{ background: 'var(--border)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{pendientes.length}</span>
        </h3>
        {pendientes.map(p => <ProcesoCard key={p.id} proc={p} />)}
      </div>

      <div style={{ minWidth: '300px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
        <h3 style={{ fontSize: '1rem', color: '#22c55e', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          EN PROCESO <span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{enProceso.length}</span>
        </h3>
        {enProceso.map(p => <ProcesoCard key={p.id} proc={p} />)}
      </div>

      <div style={{ minWidth: '300px', background: 'rgba(234, 179, 8, 0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
        <h3 style={{ fontSize: '1rem', color: '#eab308', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          PAUSADOS <span style={{ background: '#eab308', color: '#000', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{pausados.length}</span>
        </h3>
        {pausados.map(p => <ProcesoCard key={p.id} proc={p} />)}
      </div>

      <div style={{ minWidth: '300px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          TERMINADOS <span style={{ background: 'var(--border)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{terminados.length}</span>
        </h3>
        {terminados.map(p => <ProcesoCard key={p.id} proc={p} />)}
      </div>
    </div>
  );
}
