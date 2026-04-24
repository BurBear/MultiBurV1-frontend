import React from 'react';

export default function Admin({ user }) {
  return (
    <div className="fade-in" style={{ display: 'grid', gap: '2rem' }}>
      <header className="glass-panel" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Panel de Administración</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión global de la imprenta</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sesión activa como</p>
          <p style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{user.nombre}</p>
        </div>
      </header>

      <section className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Órdenes de Producción</h2>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>+</span> Nueva Orden
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Card de ejemplo vacía */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '150px', border: '1px dashed var(--border)', background: 'transparent', cursor: 'pointer' }}>
            <p style={{ color: 'var(--text-muted)' }}>No hay órdenes activas</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.5rem' }}>Crear la primera orden</p>
          </div>
        </div>
      </section>
    </div>
  );
}
