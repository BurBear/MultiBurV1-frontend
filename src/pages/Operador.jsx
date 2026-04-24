import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export default function Operador({ user }) {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Extraer el nombre del área desde el rol (ej: "OPERADOR_IMPRESION" -> "IMPRESION")
  // NOTA: ADMIN en este backend controla DISEÑO y PLACAS. Si el ADMIN abre esta vista, su área sería "". 
  // Pero App.jsx ya separa a ADMIN en otra pantalla.
  const area = user.rol.replace('OPERADOR_', '');

  const cargarDatos = async () => {
    try {
      const data = await apiFetch('/ordenes/');
      setOrdenes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleAction = async (ordenId, tipoProceso, accion) => {
    setActionLoading(true);
    try {
      await apiFetch(`/ordenes/${ordenId}/procesos/${tipoProceso}/${accion}`, {
        method: 'PUT'
      });
      // Recargar tablero tras acción exitosa
      cargarDatos();
    } catch (err) {
      alert(err.message || `Error al ${accion}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrar y agrupar procesos
  // Buscamos dentro de cada orden el proceso que corresponda a esta área
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

  // Componente interno para las tarjetas
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
      </div>
    </div>
  );

  return (
    <div className="fade-in" style={{ display: 'grid', gap: '2rem' }}>
      <header className="glass-panel" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--accent)' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Estación: {area}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Pizarra operativa de planta</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Operador en turno</p>
          <p style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{user.nombre}</p>
        </div>
      </header>

      {loading ? (
        <p>Sincronizando pizarra con el servidor...</p>
      ) : (
        <section style={{ minHeight: '60vh' }}>
          <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem', alignItems: 'flex-start' }}>
            
            {/* Columna PENDIENTES */}
            <div style={{ minWidth: '300px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                PENDIENTES <span style={{ background: 'var(--border)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{pendientes.length}</span>
              </h3>
              {pendientes.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>No hay pendientes</p>}
              {pendientes.map(p => <ProcesoCard key={p.id} proc={p} />)}
            </div>

            {/* Columna EN PROCESO */}
            <div style={{ minWidth: '300px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <h3 style={{ fontSize: '1rem', color: '#22c55e', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                EN PROCESO <span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{enProceso.length}</span>
              </h3>
              {enProceso.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>Máquina libre</p>}
              {enProceso.map(p => <ProcesoCard key={p.id} proc={p} />)}
            </div>

            {/* Columna PAUSADOS */}
            <div style={{ minWidth: '300px', background: 'rgba(234, 179, 8, 0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
              <h3 style={{ fontSize: '1rem', color: '#eab308', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                PAUSADOS <span style={{ background: '#eab308', color: '#000', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{pausados.length}</span>
              </h3>
              {pausados.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>No hay pausas</p>}
              {pausados.map(p => <ProcesoCard key={p.id} proc={p} />)}
            </div>

            {/* Columna TERMINADOS */}
            <div style={{ minWidth: '300px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                TERMINADOS <span style={{ background: 'var(--border)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{terminados.length}</span>
              </h3>
              {terminados.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>Sin trabajos</p>}
              {terminados.map(p => <ProcesoCard key={p.id} proc={p} />)}
            </div>

          </div>
        </section>
      )}
    </div>
  );
}
