import React from 'react';
import { apiFetch } from '../services/api';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Card from './ui/Card';
import Modal from './ui/Modal';
import Input from './ui/Input';
import IncidenciaFormModal from './incidencias/IncidenciaFormModal';
import IncidenciaEstadoBadge from './incidencias/IncidenciaEstadoBadge';
import * as incidenciasService from '../services/incidenciasService';
import { formatDateTime, formatLocalDateTime, formatLocalDateTimeParts } from '../utils/datetime';
import { formatNumber, formatOrderCode, formatStatus, getStatusTone } from '../utils/formatters';
import { formatIncidenciaValue } from '../utils/incidencias';
import { getProcessArea } from '../utils/procesos';

const menuItems = [
  { id: 'DISPONIBLES', label: 'Disponibles', description: 'Pendientes, en proceso y pausadas' },
  { id: 'TERMINADO', label: 'Terminadas', description: 'Proceso cerrado' },
  { id: 'BLOQUEADAS', label: 'Bloqueadas', description: 'Esperan proceso previo' },
];

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function indexById(items) {
  return asArray(items).reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

function getProgress(procesos) {
  if (!procesos.length) return 0;
  const done = procesos.filter((proceso) => proceso.estado === 'TERMINADO').length;
  return Math.round((done / procesos.length) * 100);
}

function sameId(a, b) {
  return a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);
}

function isActiveProcess(proceso) {
  return ['EN_PROCESO', 'PAUSADO'].includes(proceso?.estado);
}

function getProcesosByArea(procesos, area) {
  return asArray(procesos).filter((proceso) => getProcessArea(proceso) === area);
}

function getOperatorAreaRows(produccion, area) {
  if (produccion.estado === 'ANULADA') return [];

  const procesos = asArray(produccion.procesos);
  const areaProcesos = procesos
    .map((proceso, procesoIndex) => ({ proceso, procesoIndex }))
    .filter(({ proceso }) => getProcessArea(proceso) === area);

  if (areaProcesos.length === 0) return [];

  const currentAreaProceso = areaProcesos.find(({ proceso }) => isActiveProcess(proceso));
  const nextAreaProceso = areaProcesos.find(({ proceso }) => proceso.estado !== 'TERMINADO');
  const selected = currentAreaProceso || nextAreaProceso || areaProcesos[areaProcesos.length - 1];
  const procesoAnterior = selected.procesoIndex > 0 ? procesos[selected.procesoIndex - 1] : null;
  const puedeIniciar = !procesoAnterior || procesoAnterior.estado === 'TERMINADO';

  return [{
    id: `${produccion.id}-${selected.proceso.id}`,
    produccion,
    proceso: selected.proceso,
    procesos,
    procesoAnterior,
    puedeIniciar,
    progress: getProgress(procesos),
  }];
}

function buildRowForProcess({ produccion, procesos, proceso }) {
  const procesoIndex = procesos.findIndex((item) => item.id === proceso.id);
  const procesoAnterior = procesoIndex > 0 ? procesos[procesoIndex - 1] : null;
  const puedeIniciar = !procesoAnterior || procesoAnterior.estado === 'TERMINADO';

  return {
    id: `${produccion.id}-${proceso.id}`,
    produccion,
    proceso,
    procesos,
    procesoAnterior,
    puedeIniciar,
    progress: getProgress(procesos),
  };
}

function getImpresionProceso(procesos) {
  return asArray(procesos).find((proceso) => getProcessArea(proceso) === 'IMPRESION') || null;
}

function formatRegisteredQuantity(value) {
  return value === null || value === undefined ? '-' : formatNumber(value);
}

function getRowsForMenu(rows, menuId) {
  if (menuId === 'DISPONIBLES') {
    return rows.filter((row) => (
      row.isTrabajoActual
      || (row.proceso.estado === 'PENDIENTE' && row.puedeIniciar && !row.isLocked)
    ));
  }
  if (menuId === 'BLOQUEADAS') {
    return rows.filter((row) => row.isLocked || (row.proceso.estado === 'PENDIENTE' && !row.puedeIniciar));
  }
  return rows.filter((row) => row.proceso.estado === menuId);
}

function RefreshIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 0 1-15.2 6.5" />
      <path d="M3 12A9 9 0 0 1 18.2 5.5" />
      <path d="M18 2v4h-4" />
      <path d="M6 22v-4h4" />
    </svg>
  );
}

function emptyCierreErrors() {
  return { cantidad_buena: '', cantidad_mala: '', general: '' };
}

function CierreIncidenciaModal({ onClose, onSubmit }) {
  const [observacion, setObservacion] = React.useState('');
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!observacion.trim()) {
      setError('Ingresa la observacion de cierre.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ observacion_cierre: observacion.trim() });
    } catch (err) {
      setError(err.message || 'No se pudo cerrar la incidencia.');
      setSaving(false);
    }
  };

  return (
    <Modal title="Cerrar incidencia" onClose={onClose}>
      <form className="form-stack" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Observacion de cierre</span>
          <textarea
            className="input textarea"
            value={observacion}
            onChange={(event) => setObservacion(event.target.value)}
            rows={4}
            required
          />
        </label>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" variant="success" disabled={saving}>{saving ? 'Cerrando...' : 'Cerrar'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Pizarra({ ordenes = [], area, user, recargar, catalogs = {}, menuOpen = false, setMenuOpen }) {
  const [activeMenu, setActiveMenu] = React.useState('DISPONIBLES');
  const [actionLoading, setActionLoading] = React.useState('');
  const [incidenciaTarget, setIncidenciaTarget] = React.useState(null);
  const [selectedRow, setSelectedRow] = React.useState(null);
  const [incidenciasOrden, setIncidenciasOrden] = React.useState([]);
  const [incidenciasLoading, setIncidenciasLoading] = React.useState(false);
  const [incidenciaCloseTarget, setIncidenciaCloseTarget] = React.useState(null);
  const [cierreCantidades, setCierreCantidades] = React.useState({ cantidad_buena: '', cantidad_mala: '' });
  const [cierreErrors, setCierreErrors] = React.useState(emptyCierreErrors);

  const catalogMaps = React.useMemo(() => ({
    clientes: indexById(catalogs.clientes),
    materiales: indexById(catalogs.materiales),
    formatos: indexById(catalogs.formatos),
    maquinas: indexById(catalogs.maquinas),
  }), [catalogs]);

  const operatorRows = React.useMemo(() => {
    const baseRows = ordenes.flatMap((produccion) => getOperatorAreaRows(produccion, area));

    const trabajosActuales = baseRows.filter((row) => (
      isActiveProcess(row.proceso) && sameId(row.proceso.operador_id, user?.id)
    ));
    const tieneTrabajoActual = trabajosActuales.length > 0;

    return baseRows.map((row) => {
      const controladoPorOtroOperador = isActiveProcess(row.proceso)
        && row.proceso.operador_id
        && !sameId(row.proceso.operador_id, user?.id);
      const bloqueadoPorTrabajoActual = tieneTrabajoActual
        && !trabajosActuales.some((trabajo) => trabajo.id === row.id)
        && row.proceso.estado !== 'TERMINADO';

      return {
        ...row,
        isTrabajoActual: trabajosActuales.some((trabajo) => trabajo.id === row.id),
        controladoPorOtroOperador,
        bloqueadoPorTrabajoActual,
        isLocked: controladoPorOtroOperador || bloqueadoPorTrabajoActual,
      };
    });
  }, [area, ordenes, user?.id]);

  const counts = React.useMemo(() => {
    return menuItems.reduce((acc, item) => {
      acc[item.id] = getRowsForMenu(operatorRows, item.id).length;
      return acc;
    }, {});
  }, [operatorRows]);

  const visibleRows = getRowsForMenu(operatorRows, activeMenu);
  const activeMenuItem = menuItems.find((item) => item.id === activeMenu);
  const getMenuTone = (itemId) => {
    if (itemId === 'TERMINADO') return 'success';
    if (itemId === 'BLOQUEADAS') return 'warning';
    return 'neutral';
  };

  const handleAction = async (ordenProduccionId, tipoProceso, accion, payload = null) => {
    const loadingKey = `${ordenProduccionId}-${tipoProceso}-${accion}`;
    setActionLoading(loadingKey);
    try {
      const tipoProcesoPath = encodeURIComponent(tipoProceso);
      const procesoActualizado = await apiFetch(`/ordenes-produccion/${ordenProduccionId}/procesos/${tipoProcesoPath}/${accion}`, {
        method: 'PUT',
        ...(payload ? { body: payload } : {}),
      });
      setSelectedRow((current) => {
        if (!current || current.proceso.id !== procesoActualizado.id) return current;
        const procesos = current.procesos.map((proceso) => (
          proceso.id === procesoActualizado.id ? procesoActualizado : proceso
        ));

        if (accion === 'finalizar') {
          const procesoIndex = procesos.findIndex((proceso) => proceso.id === procesoActualizado.id);
          const areaProceso = getProcessArea(procesoActualizado);
          const siguienteProceso = procesos
            .slice(procesoIndex + 1)
            .find((proceso) => (
              getProcessArea(proceso) === areaProceso
              && proceso.estado !== 'TERMINADO'
            ));

          if (!siguienteProceso) return null;

          return {
            ...buildRowForProcess({
              produccion: current.produccion,
              procesos,
              proceso: siguienteProceso,
            }),
            previewOnly: current.previewOnly,
          };
        }

        return {
          ...current,
          proceso: procesoActualizado,
          procesos,
          progress: getProgress(procesos),
        };
      });
      await recargar({ silent: true });
      if (['iniciar', 'reanudar', 'finalizar'].includes(accion)) {
        setCierreCantidades({ cantidad_buena: '', cantidad_mala: '' });
        setCierreErrors(emptyCierreErrors());
      }
    } catch (err) {
      if (accion === 'finalizar' && payload) {
        setCierreErrors({
          cantidad_buena: 'Revisa este valor.',
          cantidad_mala: 'Revisa este valor.',
          general: err.message || 'No se pudo finalizar. Revisa las cantidades registradas.',
        });
        return;
      }
      alert(err.message || `Error al ${accion}`);
    } finally {
      setActionLoading('');
    }
  };

  const handleCrearIncidencia = async (payload) => {
    await incidenciasService.crearIncidencia(payload);
    setIncidenciaTarget(null);
    if (selectedRow?.produccion?.id) {
      await loadIncidenciasOrden(selectedRow.produccion.id);
    }
    await recargar({ silent: true });
  };

  const loadIncidenciasOrden = async (ordenProduccionId) => {
    setIncidenciasLoading(true);
    try {
      const data = await incidenciasService.listarIncidenciasPorOrdenProduccion(ordenProduccionId);
      setIncidenciasOrden(asArray(data));
    } catch {
      setIncidenciasOrden([]);
    } finally {
      setIncidenciasLoading(false);
    }
  };

  const openOrderDetail = (row, previewOnly = false) => {
    setCierreCantidades({ cantidad_buena: '', cantidad_mala: '' });
    setCierreErrors(emptyCierreErrors());
    setSelectedRow({ ...row, previewOnly });
    loadIncidenciasOrden(row.produccion.id);
  };

  const updateCierreCantidad = (field, value) => {
    setCierreCantidades((current) => ({
      ...current,
      [field]: value,
    }));
    setCierreErrors((current) => ({
      ...current,
      [field]: '',
      general: '',
    }));
  };

  const openIncidenciaFromRow = (row) => {
    setIncidenciaTarget(row);
  };

  const handleIncidenciaClose = async (payload) => {
    await incidenciasService.cerrarIncidencia(incidenciaCloseTarget.id, payload);
    setIncidenciaCloseTarget(null);
    if (selectedRow?.produccion?.id) {
      await loadIncidenciasOrden(selectedRow.produccion.id);
    }
  };

  const puedeReportarIncidencia = (proceso) => proceso.estado === 'PAUSADO';

  const requiereCantidadesCierre = (proceso) => getProcessArea(proceso) === 'IMPRESION';

  const ProductionRow = ({ row }) => {
    const { produccion, proceso, procesos } = row;
    const cliente = catalogMaps.clientes[produccion.cliente_id]?.nombre || `Cliente #${produccion.cliente_id}`;
    const material = catalogMaps.materiales[produccion.material_id]?.nombre || '-';
    const formato = catalogMaps.formatos[produccion.formato_id]?.nombre || '-';
    const maquina = catalogMaps.maquinas[produccion.maquina_id]?.nombre || 'Sin maquina';
    const codigo = formatOrderCode('OP', produccion.codigo, produccion.id);
    const entrega = formatLocalDateTimeParts(produccion.fecha_entrega_estimada);
    const isAcabados = getProcessArea(proceso) === 'ACABADOS';
    const acabadosRuta = getProcesosByArea(procesos, 'ACABADOS');
    const impresionProceso = getImpresionProceso(procesos);
    const isPreviewOnly = activeMenu !== 'DISPONIBLES' || row.isLocked;
    const lockText = row.controladoPorOtroOperador
      ? 'En uso por otro operador.'
      : row.bloqueadoPorTrabajoActual
        ? 'Bloqueada hasta finalizar el trabajo actual.'
        : '';

    return (
      <article className={`operator-order-row ${isAcabados ? 'operator-order-row-finish' : ''} ${row.isTrabajoActual ? 'operator-order-row-current' : ''} ${row.isLocked ? 'operator-order-row-locked' : ''}`}>
        <div className="operator-order-main">
          <div className="operator-order-title">
            <div>
              <span>Orden de produccion</span>
              <strong>{codigo}</strong>
            </div>
            {!row.isTrabajoActual && (
              <div className="operator-order-badges">
                <Badge tone={getStatusTone(proceso.estado)}>{formatStatus(proceso.estado)}</Badge>
              </div>
            )}
          </div>

          <div className="operator-order-description">
            <p>{produccion.descripcion || 'Sin descripcion'}</p>
            <div className="operator-order-delivery">
              <span>Entrega</span>
              <strong>{entrega.date}</strong>
              {entrega.time && <small>{entrega.time}</small>}
            </div>
          </div>
          {lockText && <small className="operator-lock-note">{lockText}</small>}
        </div>

        {isAcabados ? (
          <div className="operator-order-details operator-order-details-finish">
            <div className="operator-finish-current">
              <span>Acabado actual</span>
              <strong>{proceso.tipo_proceso}</strong>
              {acabadosRuta.length > 0 && (
                <div className="operator-finish-route-preview">
                  <span>Ruta de acabados</span>
                  <div>
                    {acabadosRuta.map((acabado) => (
                      <Badge
                        key={acabado.id}
                        tone={acabado.id === proceso.id ? 'info' : getStatusTone(acabado.estado)}
                      >
                        {acabado.tipo_proceso}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="operator-finish-metrics">
              <div>
                <span>Cliente</span>
                <strong>{cliente}</strong>
              </div>
              <div>
                <span>Solicitada</span>
                <strong>{formatNumber(produccion.cantidad)}{produccion.demasia ? ` +${formatNumber(produccion.demasia)}` : ''}</strong>
              </div>
              <div>
                <span>Buena registrada</span>
                <strong>{formatRegisteredQuantity(impresionProceso?.cantidad_buena)}</strong>
              </div>
              <div>
                <span>Mala registrada</span>
                <strong>{formatRegisteredQuantity(impresionProceso?.cantidad_mala)}</strong>
              </div>
            </div>

            <div className="operator-finish-specs">
              <div>
                <span>Formato</span>
                <strong>{formato}</strong>
                <small>{material}</small>
              </div>
              <div>
                <span>Color</span>
                <strong>{produccion.modo_color || '-'}</strong>
              </div>
              <div>
                <span>Impresion</span>
                <strong>{produccion.tipo_impresion || '-'}</strong>
              </div>
              <div>
                <span>Maquina</span>
                <strong>{maquina}</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="operator-order-details">
            <div>
              <span>Proceso</span>
              <strong>{proceso.tipo_proceso}</strong>
            </div>
            <div>
              <span>Cliente</span>
              <strong>{cliente}</strong>
            </div>
            <div>
              <span>Cantidad</span>
              <strong>{formatNumber(produccion.cantidad)}{produccion.demasia ? ` +${formatNumber(produccion.demasia)}` : ''}</strong>
            </div>
            <div>
              <span>Color</span>
              <strong>{produccion.modo_color || '-'}</strong>
            </div>
            <div>
              <span>Formato</span>
              <strong>{formato}</strong>
              <small>{material}</small>
            </div>
            <div>
              <span>Maquina</span>
              <strong>{maquina}</strong>
            </div>
            <div>
              <span>Impresion</span>
              <strong>{produccion.tipo_impresion || '-'}</strong>
            </div>
          </div>
        )}

        <div className="operator-order-actions">
          <Button size="sm" variant={isPreviewOnly ? 'outline' : 'primary'} onClick={() => openOrderDetail(row, isPreviewOnly)}>
            {row.isTrabajoActual ? 'Continuar' : isPreviewOnly ? 'Previsualizar' : 'Elegir'}
          </Button>
          {row.isTrabajoActual && (
            <span className="operator-action-state">
              <Badge tone={getStatusTone(proceso.estado)}>{formatStatus(proceso.estado)}</Badge>
              <Badge tone="info">Trabajo actual</Badge>
            </span>
          )}
        </div>
      </article>
    );
  };

  const renderOrderDetailModal = (row) => {
    const { produccion, proceso, procesos, procesoAnterior, puedeIniciar } = row;
    const cliente = catalogMaps.clientes[produccion.cliente_id]?.nombre || `Cliente #${produccion.cliente_id}`;
    const material = catalogMaps.materiales[produccion.material_id]?.nombre || '-';
    const formato = catalogMaps.formatos[produccion.formato_id]?.nombre || '-';
    const maquina = catalogMaps.maquinas[produccion.maquina_id]?.nombre || 'Sin maquina';
    const codigo = formatOrderCode('OP', produccion.codigo, produccion.id);
    const isAcabados = getProcessArea(proceso) === 'ACABADOS';
    const acabadosRuta = getProcesosByArea(procesos, 'ACABADOS');
    const impresionProceso = getImpresionProceso(procesos);
    const isBusy = Boolean(actionLoading);
    const previewOnly = Boolean(row.previewOnly);
    const incidenciasAbiertasProceso = incidenciasOrden.filter((incidencia) => (
      incidencia.proceso_id === proceso.id && incidencia.estado !== 'RESUELTA'
    ));
    const hasOpenIncidencia = incidenciasAbiertasProceso.length > 0;
    const actionsLocked = incidenciasLoading || hasOpenIncidencia || row.isLocked;
    const canReport = puedeReportarIncidencia(proceso) && !actionsLocked;
    const closeDisabled = !previewOnly && proceso.estado === 'EN_PROCESO';
    const necesitaCantidades = requiereCantidadesCierre(proceso);
    const cantidadPlanificada = Number(produccion.cantidad || 0) + Number(produccion.demasia || 0);

    const finalizarProceso = () => {
      if (necesitaCantidades) {
        const nextErrors = emptyCierreErrors();
        const cantidadBuenaTexto = cierreCantidades.cantidad_buena;
        const cantidadMalaTexto = cierreCantidades.cantidad_mala;

        if (cantidadBuenaTexto === '') {
          nextErrors.cantidad_buena = 'Ingresa la cantidad buena.';
        }
        if (cantidadMalaTexto === '') {
          nextErrors.cantidad_mala = 'Ingresa la cantidad mala.';
        }

        const cantidadBuena = Number(cantidadBuenaTexto);
        const cantidadMala = Number(cantidadMalaTexto);

        if (!nextErrors.cantidad_buena && !Number.isInteger(cantidadBuena)) {
          nextErrors.cantidad_buena = 'Debe ser un numero entero.';
        }
        if (!nextErrors.cantidad_mala && !Number.isInteger(cantidadMala)) {
          nextErrors.cantidad_mala = 'Debe ser un numero entero.';
        }

        if (!nextErrors.cantidad_buena && cantidadBuena < 0) {
          nextErrors.cantidad_buena = 'No puede ser negativa.';
        }
        if (!nextErrors.cantidad_mala && cantidadMala < 0) {
          nextErrors.cantidad_mala = 'No puede ser negativa.';
        }

        if (nextErrors.cantidad_buena || nextErrors.cantidad_mala) {
          setCierreErrors(nextErrors);
          return;
        }

        const totalRegistrado = cantidadBuena + cantidadMala;
        if (totalRegistrado <= 0) {
          nextErrors.cantidad_buena = 'Revisa la suma registrada.';
          nextErrors.cantidad_mala = 'Revisa la suma registrada.';
          nextErrors.general = 'La suma de cantidad buena y mala debe ser mayor que cero.';
          setCierreErrors(nextErrors);
          return;
        }

        if (totalRegistrado > cantidadPlanificada) {
          nextErrors.cantidad_buena = 'Supera lo planificado.';
          nextErrors.cantidad_mala = 'Supera lo planificado.';
          nextErrors.general = `La suma no puede superar la cantidad planificada (${formatNumber(cantidadPlanificada)}).`;
          setCierreErrors(nextErrors);
          return;
        }

        setCierreErrors(emptyCierreErrors());
        handleAction(produccion.id, proceso.tipo_proceso, 'finalizar', {
          cantidad_buena: cantidadBuena,
          cantidad_mala: cantidadMala,
        });
        return;
      }

      handleAction(produccion.id, proceso.tipo_proceso, 'finalizar');
    };

    return (
      <Modal
        title={isAcabados ? 'Detalle de acabado' : previewOnly ? 'Previsualizar orden' : 'Detalle de orden'}
        onClose={() => setSelectedRow(null)}
        panelClassName="modal-panel-wide operator-detail-modal"
        headerMeta={<Badge tone={getStatusTone(proceso.estado)}>{formatStatus(proceso.estado)}</Badge>}
        closeDisabled={closeDisabled}
      >
        <div className="operator-detail-grid">
          <section className="operator-detail-section">
            <h3>{isAcabados ? 'Datos de produccion' : 'Datos'}</h3>
            <div className="operator-detail-kpis">
              <div>
                <span>{isAcabados ? 'Solicitada' : 'Cantidad'}</span>
                <strong>{formatNumber(produccion.cantidad)}</strong>
              </div>
              <div>
                <span>Demasia</span>
                <strong>{formatNumber(produccion.demasia || 0)}</strong>
              </div>
              {isAcabados && (
                <>
                  <div>
                    <span>Buena registrada</span>
                    <strong>{formatRegisteredQuantity(impresionProceso?.cantidad_buena)}</strong>
                  </div>
                  <div>
                    <span>Mala registrada</span>
                    <strong>{formatRegisteredQuantity(impresionProceso?.cantidad_mala)}</strong>
                  </div>
                </>
              )}
            </div>

            <dl className="operator-detail-list">
              <div><dt>Orden</dt><dd>{codigo}</dd></div>
              <div><dt>{isAcabados ? 'Acabado actual' : 'Proceso'}</dt><dd>{proceso.tipo_proceso}</dd></div>
              <div><dt>Estado</dt><dd>{formatStatus(proceso.estado)}</dd></div>
              <div><dt>Cliente</dt><dd>{cliente}</dd></div>
              <div><dt>Trabajo</dt><dd>{produccion.descripcion || '-'}</dd></div>
              <div><dt>Entrega</dt><dd>{formatLocalDateTime(produccion.fecha_entrega_estimada)}</dd></div>
              <div><dt>Formato</dt><dd>{formato}</dd></div>
              <div><dt>Material</dt><dd>{material}</dd></div>
              <div><dt>Maquina sugerida</dt><dd>{maquina}</dd></div>
              <div><dt>Impresion</dt><dd>{produccion.tipo_impresion || '-'}</dd></div>
              <div><dt>Color</dt><dd>{produccion.modo_color || '-'}</dd></div>
              {!isAcabados && proceso.cantidad_buena !== null && proceso.cantidad_buena !== undefined && (
                <div><dt>Buena</dt><dd>{formatNumber(proceso.cantidad_buena)}</dd></div>
              )}
              {!isAcabados && proceso.cantidad_mala !== null && proceso.cantidad_mala !== undefined && (
                <div><dt>Mala</dt><dd>{formatNumber(proceso.cantidad_mala)}</dd></div>
              )}
            </dl>

          </section>

          <section className="operator-detail-section">
            <h3>{isAcabados ? 'Control de acabado' : previewOnly ? 'Proceso' : 'Acciones'}</h3>
            <div className="operator-process-summary">
              <strong>{proceso.tipo_proceso}</strong>
              <Badge tone={getStatusTone(proceso.estado)}>{formatStatus(proceso.estado)}</Badge>
            </div>

            {isAcabados ? (
              <div className="operator-finish-route-detail">
                <span>Ruta de acabados</span>
                <div>
                  {acabadosRuta.map((acabado) => (
                    <div key={acabado.id} className={acabado.id === proceso.id ? 'operator-finish-route-step-current' : ''}>
                      <strong>{acabado.tipo_proceso}</strong>
                      <Badge tone={getStatusTone(acabado.estado)}>{formatStatus(acabado.estado)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="operator-machine-field">
                <span>Maquina asignada</span>
                <strong>{maquina}</strong>
              </div>
            )}

            {!puedeIniciar && proceso.estado === 'PENDIENTE' && (
              <div className="alert alert-warning">
                Esperando que termine {procesoAnterior?.tipo_proceso}.
              </div>
            )}

            {hasOpenIncidencia && (
              <div className="alert alert-warning">
                Hay una incidencia abierta en este proceso. Resuelvela antes de continuar la produccion.
              </div>
            )}

            {closeDisabled && (
              <div className="alert alert-warning">
                Para cerrar este detalle, pausa o finaliza el proceso.
              </div>
            )}

            {row.bloqueadoPorTrabajoActual && (
              <div className="alert alert-warning">
                Finaliza o continua tu trabajo actual antes de iniciar otra orden de produccion.
              </div>
            )}

            {row.controladoPorOtroOperador && (
              <div className="alert alert-warning">
                Esta orden esta siendo controlada por otro operador.
              </div>
            )}

            {!previewOnly && (
              <>
                <div className="operator-detail-actions">
                  {proceso.estado === 'PENDIENTE' && (
                    <Button
                      variant="success"
                      onClick={() => handleAction(produccion.id, proceso.tipo_proceso, 'iniciar')}
                      disabled={isBusy || !puedeIniciar || actionsLocked}
                    >
                      Iniciar
                    </Button>
                  )}

                  {proceso.estado === 'EN_PROCESO' && (
                    <>
                      {necesitaCantidades && (
                        <div className="operator-close-quantities">
                          <p className="operator-close-quantities-note">
                            Planificado: {formatNumber(cantidadPlanificada)}
                          </p>
                          <Input
                            label="Cantidad buena"
                            name="cantidad_buena"
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            value={cierreCantidades.cantidad_buena}
                            onChange={(event) => updateCierreCantidad('cantidad_buena', event.target.value)}
                            placeholder="Ej: 480"
                            disabled={isBusy || actionsLocked}
                            error={cierreErrors.cantidad_buena}
                            required
                          />
                          <Input
                            label="Cantidad mala"
                            name="cantidad_mala"
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            value={cierreCantidades.cantidad_mala}
                            onChange={(event) => updateCierreCantidad('cantidad_mala', event.target.value)}
                            placeholder="Ej: 10"
                            disabled={isBusy || actionsLocked}
                            error={cierreErrors.cantidad_mala}
                            required
                          />
                          {cierreErrors.general && (
                            <p className="operator-close-quantities-error">{cierreErrors.general}</p>
                          )}
                        </div>
                      )}
                      <Button
                        variant="warning"
                        onClick={() => handleAction(produccion.id, proceso.tipo_proceso, 'pausar')}
                        disabled={isBusy || actionsLocked}
                      >
                        Pausar
                      </Button>
                      <Button
                        variant="success"
                        onClick={finalizarProceso}
                        disabled={isBusy || actionsLocked}
                      >
                        Finalizar
                      </Button>
                    </>
                  )}

                  {proceso.estado === 'PAUSADO' && (
                    <Button
                      onClick={() => handleAction(produccion.id, proceso.tipo_proceso, 'reanudar')}
                      disabled={isBusy || actionsLocked}
                    >
                      Reanudar
                    </Button>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => openIncidenciaFromRow(row)}
                  disabled={isBusy || !canReport}
                  title={hasOpenIncidencia ? 'Resuelve la incidencia abierta antes de registrar otra.' : !canReport ? 'Pausa el proceso para reportar una incidencia.' : 'Reportar incidencia'}
                >
                  Reportar incidencia
                </Button>
              </>
            )}
          </section>

          <section className="operator-detail-section operator-incidencias-section">
            <div className="operator-incidencias-heading">
              <div>
                <h3>Incidencias</h3>
                <p>{incidenciasLoading ? 'Cargando...' : `${incidenciasOrden.length} registradas`}</p>
              </div>
              <Button
                className="icon-button"
                variant="outline"
                onClick={() => loadIncidenciasOrden(produccion.id)}
                disabled={incidenciasLoading}
                aria-label="Refrescar incidencias"
                title="Refrescar incidencias"
              >
                <RefreshIcon />
              </Button>
            </div>

            {incidenciasLoading ? (
              <p className="muted">Cargando incidencias...</p>
            ) : incidenciasOrden.length === 0 ? (
              <div className="empty-state compact">
                <strong>Sin incidencias</strong>
                <p>No hay incidencias registradas para esta orden de produccion.</p>
              </div>
            ) : (
              <div className="operator-incidencias-list">
                {incidenciasOrden.map((incidencia) => (
                  <article key={incidencia.id} className="operator-incidencia-item">
                    <div>
                      <strong>{formatIncidenciaValue(incidencia.tipo)}</strong>
                      <span>{incidencia.descripcion}</span>
                      <small>Creada: {formatDateTime(incidencia.fecha_registro)}</small>
                    </div>
                    <div className="operator-incidencia-badges">
                      <IncidenciaEstadoBadge value={incidencia.prioridad} type="prioridad" />
                      <IncidenciaEstadoBadge value={incidencia.estado} />
                    </div>
                    {!previewOnly && incidencia.estado !== 'RESUELTA' && (
                      <div className="operator-incidencia-actions">
                        <Button size="sm" variant="success" onClick={() => setIncidenciaCloseTarget(incidencia)}>
                          Cerrar
                        </Button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </Modal>
    );
  };

  if (operatorRows.length === 0) {
    return (
      <Card className="empty-state">
        <h2>No hay ordenes de produccion para {area}</h2>
        <p>Cuando existan producciones con proceso {area}, apareceran en esta pizarra.</p>
      </Card>
    );
  }

  return (
    <>
      {menuOpen && (
        <button
          className="admin-sidebar-backdrop"
          type="button"
          aria-label="Cerrar menu"
          onClick={() => setMenuOpen?.(false)}
        />
      )}

      <aside className={`admin-sidebar operator-state-drawer ${menuOpen ? 'admin-sidebar-open' : ''}`}>
        <div className="admin-drawer-header">
          <div className="admin-drawer-brand">
            <span className="sidebar-mark">OP</span>
            <div>
              <strong>Estados</strong>
              <span>{area}</span>
            </div>
          </div>
          <Button
            className="sidebar-toggle"
            variant="ghost"
            size="sm"
            onClick={() => setMenuOpen?.(false)}
            aria-label="Cerrar menu"
            title="Cerrar menu"
          >
            x
          </Button>
        </div>

        <nav className="admin-menu" aria-label="Menu operativo">
          <div className="admin-menu-group">
            <button
              type="button"
              className="admin-menu-group-toggle"
              aria-expanded="true"
            >
              <span>Produccion</span>
              <span className="admin-menu-chevron admin-menu-chevron-open" aria-hidden="true" />
            </button>

            <div className="admin-menu-items">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  className="admin-menu-item operator-drawer-item"
                  variant={activeMenu === item.id ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setActiveMenu(item.id);
                    setMenuOpen?.(false);
                  }}
                >
                  <span className="admin-menu-item-mark">
                    <Badge tone={getMenuTone(item.id)}>{counts[item.id]}</Badge>
                  </span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      <section className="operator-board">
        <div className="operator-board-content">
          <div className="operator-board-heading">
            <div>
              <h2>{activeMenuItem?.label}</h2>
              <p>{visibleRows.length} ordenes de produccion en {area}</p>
            </div>
            <div className="section-actions">
              <Button
                className="icon-button"
                variant="outline"
                onClick={recargar}
                disabled={Boolean(actionLoading)}
                aria-label="Refrescar"
                title="Refrescar"
              >
                <RefreshIcon />
              </Button>
            </div>
          </div>

          {visibleRows.length === 0 ? (
            <div className="empty-state compact">
              <strong>Sin ordenes en este estado</strong>
              <p>Selecciona otro estado del menu lateral.</p>
            </div>
          ) : (
            <div className="operator-order-list">
              {visibleRows.map((row) => <ProductionRow key={row.id} row={row} />)}
            </div>
          )}
        </div>
      </section>

      {selectedRow && renderOrderDetailModal(selectedRow)}

      {incidenciaTarget && (
        <IncidenciaFormModal
          title={`Reportar incidencia - ${formatOrderCode('OP', incidenciaTarget.produccion.codigo, incidenciaTarget.produccion.id)}`}
          defaults={{
            orden_id: incidenciaTarget.produccion.orden_trabajo_id,
            orden_produccion_id: incidenciaTarget.produccion.id,
            proceso_id: incidenciaTarget.proceso.id,
          }}
          lockedContext
          contextLabel="Orden de produccion"
          contextValue={formatOrderCode('OP', incidenciaTarget.produccion.codigo, incidenciaTarget.produccion.id)}
          contextMeta={`Proceso ${incidenciaTarget.proceso.tipo_proceso}`}
          onClose={() => setIncidenciaTarget(null)}
          onSubmit={handleCrearIncidencia}
        />
      )}

      {incidenciaCloseTarget && (
        <CierreIncidenciaModal
          incidencia={incidenciaCloseTarget}
          onClose={() => setIncidenciaCloseTarget(null)}
          onSubmit={handleIncidenciaClose}
        />
      )}
    </>
  );
}
