import { useEffect, useMemo, useState } from 'react';
import Pizarra from '../components/Pizarra';
import * as clientesService from '../services/clientesService';
import * as formatosService from '../services/formatosService';
import * as maquinasService from '../services/maquinasService';
import * as materialesService from '../services/materialesService';
import * as ordenesProduccionService from '../services/ordenesProduccionService';
import { getProcessArea } from '../utils/procesos';
import { getStationFromRole } from '../utils/roles';

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function normalizeOrdenesProduccion(ordenesProduccionData) {
  return asArray(ordenesProduccionData).map((produccion) => ({
    ...produccion,
    procesos: asArray(produccion.procesos),
    juegos_impresion: asArray(produccion.juegos_impresion),
    orden_trabajo_id: produccion.orden_trabajo_id ?? null,
    orden_trabajo_codigo: produccion.orden_trabajo_codigo || null,
  }));
}

export default function Operador({ user, menuOpen, setMenuOpen }) {
  const [ordenes, setOrdenes] = useState([]);
  const [catalogs, setCatalogs] = useState({
    clientes: [],
    materiales: [],
    formatos: [],
    maquinas: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const area = getStationFromRole(user.rol);
  const procesosAsignados = useMemo(() => {
    return ordenes.some((orden) => (
      orden.estado !== 'ANULADA'
      && orden.procesos?.some((proceso) => getProcessArea(proceso) === area)
    ));
  }, [ordenes, area]);

  const cargarDatos = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [
        ordenesData,
        clientesData,
        materialesData,
        formatosData,
        maquinasData,
      ] = await Promise.all([
        ordenesProduccionService.listarOrdenesProduccionResumen(),
        clientesService.listar(),
        materialesService.listar(),
        formatosService.listar(),
        maquinasService.listar(),
      ]);

      setOrdenes(normalizeOrdenesProduccion(ordenesData));
      setCatalogs({
        clientes: asArray(clientesData),
        materiales: asArray(materialesData),
        formatos: asArray(formatosData),
        maquinas: asArray(maquinasData),
      });
    } catch (err) {
      setError(err.message || 'Error al cargar las ordenes de produccion');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, []);

  return (
    <div className="page-stack fade-in">
      {loading ? (
        <p className="muted">Sincronizando ordenes de produccion con el servidor...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : !procesosAsignados ? (
        <div className="empty-state">
          <h2>No hay procesos disponibles</h2>
          <p>No existen ordenes de produccion activas para la estacion {area}.</p>
        </div>
      ) : (
        <section className="board-section">
          <Pizarra
            ordenes={ordenes}
            area={area}
            user={user}
            catalogs={catalogs}
            recargar={cargarDatos}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />
        </section>
      )}
    </div>
  );
}
