import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export default function Admin({ user }) {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para el modal de creación
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    cliente: '',
    descripcion: '',
    cantidad: 1,
    tipo_servicio: 'COMPLETO',
    procesos_personalizados: []
  });

  const cargarOrdenes = async () => {
    try {
      const data = await apiFetch('/ordenes/');
      setOrdenes(data);
    } catch (err) {
      setError('Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (proceso) => {
    const actuales = formData.procesos_personalizados;
    if (actuales.includes(proceso)) {
      setFormData({ ...formData, procesos_personalizados: actuales.filter(p => p !== proceso) });
    } else {
      setFormData({ ...formData, procesos_personalizados: [...actuales, proceso] });
    }
  };

  const handleCrearOrden = async (e) => {
    e.preventDefault();
    try {
      // Limpiar data antes de enviar (FastAPI odia campos nulos si no los necesita)
      const payload = {
        cliente: formData.cliente,
        descripcion: formData.descripcion,
        cantidad: parseInt(formData.cantidad, 10),
        tipo_servicio: formData.tipo_servicio,
      };

      if (formData.tipo_servicio === 'PERSONALIZADO') {
        payload.procesos_personalizados = formData.procesos_personalizados;
      }

      await apiFetch('/ordenes/', {
        method: 'POST',
        body: payload
      });
      setShowModal(false);
      setFormData({ cliente: '', descripcion: '', cantidad: 1, tipo_servicio: 'COMPLETO', procesos_personalizados: [] });
      cargarOrdenes();
    } catch (err) {
      alert(err.message || "Error al crear la orden");
    }
  };

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
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>+</span> Nueva Orden
          </button>
        </div>
        
        {loading ? (
          <p>Cargando órdenes...</p>
        ) : error ? (
          <p style={{ color: 'var(--accent)' }}>{error}</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {ordenes.length === 0 ? (
              <div className="card" onClick={() => setShowModal(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '150px', border: '1px dashed var(--border)', background: 'transparent', cursor: 'pointer' }}>
                <p style={{ color: 'var(--text-muted)' }}>No hay órdenes activas</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.5rem' }}>Click para crear tu primera orden</p>
              </div>
            ) : (
              ordenes.map(orden => (
                <div key={orden.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>{orden.cliente}</h3>
                    <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary)', borderRadius: '12px' }}>
                      {orden.estado}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>{orden.descripcion}</p>
                  <p style={{ fontSize: '0.9rem' }}>Cantidad: <strong>{orden.cantidad}</strong></p>
                  <p style={{ fontSize: '0.9rem' }}>Servicio: <strong>{orden.tipo_servicio}</strong></p>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* MODAL CREAR ORDEN */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-panel)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>Crear Nueva Orden</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', padding: 0, color: 'var(--text-muted)' }}>X</button>
            </div>

            <form onSubmit={handleCrearOrden} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Cliente</label>
                <input name="cliente" value={formData.cliente} onChange={handleChange} required placeholder="Nombre del cliente" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Descripción / Producto</label>
                <input name="descripcion" value={formData.descripcion} onChange={handleChange} required placeholder="Ej: Revistas 20 pág" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Cantidad a producir</label>
                <input type="number" name="cantidad" value={formData.cantidad} onChange={handleChange} required min="1" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Tipo de Servicio</label>
                <select name="tipo_servicio" value={formData.tipo_servicio} onChange={handleChange} style={{ width: '100%', padding: '12px', background: 'var(--bg-dark)', color: 'white', border: `1px solid var(--border)`, borderRadius: '6px' }}>
                  <option value="COMPLETO">COMPLETO</option>
                  <option value="SOLO_IMPRESION">SOLO IMPRESIÓN</option>
                  <option value="PERSONALIZADO">PERSONALIZADO</option>
                </select>
              </div>

              {formData.tipo_servicio === 'PERSONALIZADO' && (
                <div style={{ padding: '10px', border: '1px dashed var(--border)', borderRadius: '6px' }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Selecciona los procesos:</p>
                  {['DISEÑO', 'PLACAS', 'IMPRESION', 'ACABADOS'].map(proc => (
                    <label key={proc} style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        style={{ width: 'auto', marginRight: '10px' }}
                        checked={formData.procesos_personalizados.includes(proc)}
                        onChange={() => handleCheckboxChange(proc)}
                      />
                      {proc}
                    </label>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: '1px solid var(--border)' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1 }}>Guardar Orden</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
