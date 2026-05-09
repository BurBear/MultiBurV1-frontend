import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';
import Pizarra from '../components/Pizarra';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import OrdenCard from '../components/ordenes/OrdenCard';
import OrdenFormModal from '../components/ordenes/OrdenFormModal';

const tabs = [
  { id: 'ORDENES', label: 'Vista global' },
  { id: 'DISEÑO', label: 'Estacion: DISEÑO' },
  { id: 'PLACAS', label: 'Estacion: PLACAS' },
];

function getResumen(ordenes) {
  return {
    total: ordenes.length,
    pendientes: ordenes.filter((orden) => orden.estado === 'PENDIENTE').length,
    enProceso: ordenes.filter((orden) => orden.estado === 'EN_PROCESO').length,
    terminadas: ordenes.filter((orden) => orden.estado === 'TERMINADO').length,
  };
}

export default function Admin({ user }) {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ORDENES');
  const [showModal, setShowModal] = useState(false);

  const resumen = useMemo(() => getResumen(ordenes), [ordenes]);

  const cargarOrdenes = async () => {
    setError('');
    try {
      const data = await apiFetch('/ordenes/');
      setOrdenes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar las ordenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarOrdenes();
  }, []);

  const handleCrearOrden = async (payload) => {
    await apiFetch('/ordenes/', {
      method: 'POST',
      body: payload,
    });
    setShowModal(false);
    await cargarOrdenes();
  };

  return (
    <div className="page-stack fade-in">
      <PageHeader
        title="Panel de Administracion"
        subtitle="Gestion global y control de pre-prensa"
        meta={
          <>
            <span className="eyebrow">Sesion activa como</span>
            <strong>{user.nombre}</strong>
          </>
        }
      />

      <section className="stats-grid" aria-label="Resumen de ordenes">
        <Card className="stat-card">
          <span>Total</span>
          <strong>{resumen.total}</strong>
        </Card>
        <Card className="stat-card">
          <span>Pendientes</span>
          <strong>{resumen.pendientes}</strong>
        </Card>
        <Card className="stat-card">
          <span>En proceso</span>
          <strong>{resumen.enProceso}</strong>
        </Card>
        <Card className="stat-card">
          <span>Terminadas</span>
          <strong>{resumen.terminadas}</strong>
        </Card>
      </section>

      <div className="tabs">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <section className="panel">
        {activeTab === 'ORDENES' ? (
          <>
            <div className="section-heading">
              <div>
                <h2>Gestion de ordenes</h2>
                <p>Listado y alta de ordenes de produccion.</p>
              </div>
              <Button onClick={() => setShowModal(true)}>+ Nueva orden</Button>
            </div>

            {loading ? (
              <p className="muted">Cargando ordenes...</p>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : ordenes.length === 0 ? (
              <Card as="button" className="empty-action" onClick={() => setShowModal(true)}>
                <strong>No hay ordenes activas</strong>
                <span>Crear primera orden</span>
              </Card>
            ) : (
              <div className="orden-grid">
                {ordenes.map((orden) => (
                  <OrdenCard key={orden.id} orden={orden} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="section-heading">
              <div>
                <h2>Pizarra de {activeTab}</h2>
                <p>Procesos pre-prensa visibles para administracion.</p>
              </div>
            </div>
            <Pizarra ordenes={ordenes} area={activeTab} recargar={cargarOrdenes} user={user} />
          </>
        )}
      </section>

      {showModal && <OrdenFormModal onClose={() => setShowModal(false)} onSubmit={handleCrearOrden} />}
    </div>
  );
}
