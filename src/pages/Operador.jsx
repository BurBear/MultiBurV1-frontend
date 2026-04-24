import React from 'react';

export default function Operador({ user }) {
  return (
    <div>
      <h1>Estación de Trabajo: {user.rol.replace('OPERADOR_', '')}</h1>
      <p>Bienvenido, Operador <strong>{user.nombre}</strong></p>
      <hr />
      <div>
        <h3>Pizarra de Producción</h3>
        <p>Aquí se visualizarán las tarjetas de procesos asignadas a tu área (Pendiente de implementación)</p>
      </div>
    </div>
  );
}
