import React from 'react';

export default function Operador({ user }) {
  const area = user.rol.replace('OPERADOR_', '');
  
  return (
    <div className="fade-in" style={{ display: 'grid', gap: '2rem' }}>
      <header className="glass-panel" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--accent)' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Estación: {area}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Pizarra operativa de planta</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Operador en turno</p>
          <p style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{user.nombre}</p>
        </div>
      </header>

      <section className="glass-panel" style={{ minHeight: '60vh' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Cola de Trabajo</h2>
        
        <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {/* Columna de ejemplo */}
          <div style={{ minWidth: '350px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              PENDIENTES <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>0</span>
            </h3>
            
            <div className="card" style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border)', background: 'transparent' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay tareas asignadas</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
