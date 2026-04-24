import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import Pizarra from '../components/Pizarra';

export default function Operador({ user }) {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extraer el nombre del área desde el rol
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
          <Pizarra ordenes={ordenes} area={area} recargar={cargarDatos} />
        </section>
      )}
    </div>
  );
}
