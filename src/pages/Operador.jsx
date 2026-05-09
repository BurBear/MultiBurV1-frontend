import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';
import Pizarra from '../components/Pizarra';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/ui/Card';
import { getRoleLabel, getStationFromRole } from '../utils/roles';

export default function Operador({ user }) {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const area = getStationFromRole(user.rol);
  const procesosDisponibles = useMemo(() => {
    return ordenes.some((orden) => orden.estado !== 'ANULADA' && orden.procesos?.some((proceso) => proceso.tipo_proceso === area));
  }, [ordenes, area]);

  const cargarDatos = async () => {
    setError('');
    try {
      const data = await apiFetch('/ordenes/');
      setOrdenes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar la pizarra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, []);

  return (
    <div className="page-stack fade-in">
      <PageHeader
        title={`Estacion: ${area}`}
        subtitle="Pizarra operativa de planta"
        accent="accent"
        meta={
          <>
            <span className="eyebrow">Operador en turno</span>
            <strong>{user.nombre}</strong>
          </>
        }
      />

      <section className="operator-summary">
        <Card className="stat-card">
          <span>Operador</span>
          <strong>{user.nombre}</strong>
        </Card>
        <Card className="stat-card">
          <span>Rol</span>
          <strong>{getRoleLabel(user.rol)}</strong>
        </Card>
        <Card className="stat-card">
          <span>Estacion asignada</span>
          <strong>{area}</strong>
        </Card>
      </section>

      {loading ? (
        <p className="muted">Sincronizando pizarra con el servidor...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : !procesosDisponibles ? (
        <Card className="empty-state">
          <h2>No hay procesos disponibles</h2>
          <p>No existen ordenes activas para la estacion {area}.</p>
        </Card>
      ) : (
        <section className="board-section">
          <Pizarra ordenes={ordenes} area={area} recargar={cargarDatos} user={user} />
        </section>
      )}
    </div>
  );
}
