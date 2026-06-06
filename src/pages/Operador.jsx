import { useEffect, useMemo, useState } from 'react';
import Pizarra from '../components/Pizarra';
import * as clientesService from '../services/clientesService';
import * as formatosService from '../services/formatosService';
import * as maquinasService from '../services/maquinasService';
import * as materialesService from '../services/materialesService';
import * as ordenesProduccionService from '../services/ordenesProduccionService';
import * as ordenesTrabajoService from '../services/ordenesTrabajoService';
import { getProcessArea } from '../utils/procesos';
import { getStationFromRole } from '../utils/roles';

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function mergeOrdenesProduccion(ordenesProduccionData, ordenesTrabajoData) {
  const byId = new Map();

  const addProduccion = (produccion, ordenTrabajo = null) => {
    if (!produccion?.id) return;

    const normalized = {
      ...produccion,
      orden_trabajo_id: produccion.orden_trabajo_id ?? ordenTrabajo?.id ?? null,
      orden_trabajo_codigo: produccion.orden_trabajo_codigo || ordenTrabajo?.codigo || null,
      orden_trabajo_nombre: produccion.orden_trabajo_nombre || ordenTrabajo?.nombre || null,
    };
    const key = String(normalized.id);
    const current = byId.get(key);

    if (!current) {
      byId.set(key, normalized);
      return;
    }

    byId.set(key, {
      ...normalized,
      ...current,
      procesos: asArray(current.procesos).length ? current.procesos : normalized.procesos,
      orden_trabajo_id: current.orden_trabajo_id ?? normalized.orden_trabajo_id,
      orden_trabajo_codigo: current.orden_trabajo_codigo || normalized.orden_trabajo_codigo,
      orden_trabajo_nombre: current.orden_trabajo_nombre || normalized.orden_trabajo_nombre,
    });
  };

  asArray(ordenesProduccionData).forEach((produccion) => addProduccion(produccion));
  asArray(ordenesTrabajoData).forEach((ordenTrabajo) => {
    asArray(ordenTrabajo.ordenes_produccion).forEach((produccion) => addProduccion(produccion, ordenTrabajo));
  });

  return Array.from(byId.values());
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
        ordenesTrabajoData,
        clientesData,
        materialesData,
        formatosData,
        maquinasData,
      ] = await Promise.all([
        ordenesProduccionService.listarOrdenesProduccion(),
        ordenesTrabajoService.listarOrdenesTrabajo(),
        clientesService.listar(),
        materialesService.listar(),
        formatosService.listar(),
        maquinasService.listar(),
      ]);

      setOrdenes(mergeOrdenesProduccion(ordenesData, ordenesTrabajoData));
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
