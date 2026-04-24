import React from 'react';

export default function Admin({ user }) {
  return (
    <div>
      <h1>Panel de Administración</h1>
      <p>Bienvenido, <strong>{user.nombre}</strong></p>
      <hr />
      <div>
        <h3>Órdenes de Producción</h3>
        <p>Aquí irá el formulario para crear órdenes de producción (Pendiente de implementación)</p>
        <button disabled>Crear Nueva Orden</button>
      </div>
    </div>
  );
}
