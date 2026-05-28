import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import IncidenciaDetalleModal from '../../components/incidencias/IncidenciaDetalleModal';
import IncidenciaFilters from '../../components/incidencias/IncidenciaFilters';
import IncidenciasTable from '../../components/incidencias/IncidenciasTable';
import * as incidenciasService from '../../services/incidenciasService';

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function getInitialFilters() {
  return {
    estado: 'TODOS',
    tipo: 'TODOS',
    prioridad: 'TODOS',
    tipo_proceso: 'TODOS',
  };
}

export default function Incidencias() {
  const [incidencias, setIncidencias] = useState([]);
  const [filters, setFilters] = useState(getInitialFilters);
  const [selected, setSelected] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const requestFilters = useMemo(() => ({
    estado: filters.estado,
    tipo: filters.tipo,
    prioridad: filters.prioridad,
    tipo_proceso: filters.tipo_proceso,
  }), [filters]);

  const loadIncidencias = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await incidenciasService.listarIncidencias(requestFilters);
      setIncidencias(asArray(data));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las incidencias.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistorial = async (incidenciaId) => {
    setHistorialLoading(true);
    try {
      const data = await incidenciasService.listarHistorialIncidencia(incidenciaId);
      setHistorial(asArray(data));
    } catch (err) {
      setHistorial([]);
      setError(err.message || 'No se pudo cargar el historial de la incidencia.');
    } finally {
      setHistorialLoading(false);
    }
  };

  const openDetail = async (incidencia) => {
    setError('');
    setSelected(incidencia);
    try {
      const detail = await incidenciasService.obtenerIncidencia(incidencia.id);
      setSelected(detail);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el detalle de la incidencia.');
    }
    await loadHistorial(incidencia.id);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadIncidencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestFilters]);

  const clearFilters = () => {
    setFilters(getInitialFilters());
  };

  const visibleError = error && !error.includes('Solo los operadores pueden cambiar o cerrar incidencias');

  return (
    <div className="page-stack fade-in">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Incidencias</h2>
            <p>{loading ? 'Cargando datos...' : `${incidencias.length} incidencias visibles`}</p>
          </div>
          <div className="section-actions">
            <Button
              className="icon-button"
              variant="outline"
              onClick={loadIncidencias}
              disabled={loading}
              aria-label="Refrescar"
              title="Refrescar"
            >
              {'R'}
            </Button>
          </div>
        </div>

        <IncidenciaFilters
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          loading={loading}
        />

        {visibleError && <div className="alert alert-danger">{visibleError}</div>}

        {loading ? (
          <p className="muted">Cargando incidencias...</p>
        ) : (
          <IncidenciasTable
            incidencias={incidencias}
            onView={openDetail}
          />
        )}
      </section>

      {selected && (
        <IncidenciaDetalleModal
          incidencia={selected}
          historial={historial}
          historialLoading={historialLoading}
          onClose={() => {
            setSelected(null);
            setHistorial([]);
          }}
          onRefreshHistorial={() => loadHistorial(selected.id)}
        />
      )}

    </div>
  );
}
