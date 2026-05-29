import { useEffect, useMemo, useState } from 'react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import { apiFetch } from '../../services/api';
import * as clientesService from '../../services/clientesService';
import * as formatosService from '../../services/formatosService';
import * as incidenciasService from '../../services/incidenciasService';
import * as maquinasService from '../../services/maquinasService';
import * as materialesService from '../../services/materialesService';
import * as ordenesProduccionService from '../../services/ordenesProduccionService';
import * as ordenesTrabajoService from '../../services/ordenesTrabajoService';
import { formatLocalDateTime, formatLocalDateTimeParts } from '../../utils/datetime';
import { formatNumber, formatOrderCode, formatStatus, getStatusTone } from '../../utils/formatters';

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function indexById(items) {
  return items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

function getProgress(producciones) {
  const procesos = producciones.flatMap((produccion) => asArray(produccion.procesos));
  if (procesos.length > 0) {
    const done = procesos.filter((proceso) => proceso.estado === 'TERMINADO').length;
    return Math.round((done / procesos.length) * 100);
  }

  if (producciones.length > 0) {
    const done = producciones.filter((produccion) => produccion.estado === 'TERMINADO').length;
    return Math.round((done / producciones.length) * 100);
  }

  return 0;
}

function getProductionStatusFromProcesses(procesos, fallback = 'PENDIENTE') {
  const estados = asArray(procesos).map((proceso) => proceso.estado);
  if (estados.length === 0) return fallback;
  if (estados.every((estado) => estado === 'TERMINADO')) return 'TERMINADO';
  if (estados.includes('EN_PROCESO')) return 'EN_PROCESO';
  if (estados.includes('PAUSADO')) return 'PAUSADO';
  return 'PENDIENTE';
}

function getWorkOrderBoardStatus(orden) {
  if (orden.estado !== 'ENTREGADA' && orden.progress === 100) return 'LISTO';
  return orden.estado;
}

function getCurrentProcess(procesos) {
  const items = asArray(procesos);
  return (
    items.find((proceso) => proceso.estado === 'EN_PROCESO')
    || items.find((proceso) => proceso.estado === 'PAUSADO')
    || items.find((proceso) => proceso.estado === 'PENDIENTE')
    || items[items.length - 1]
    || null
  );
}

function matchesStatusFilter(status, filter) {
  if (filter === 'TODOS') return true;
  if (filter === 'ACTIVOS') return !['TERMINADO', 'ENTREGADA', 'ANULADA', 'INACTIVO'].includes(status);
  if (filter === 'TERMINADOS') return ['TERMINADO', 'ENTREGADA'].includes(status);
  return true;
}

function ProgressBar({ value }) {
  return (
    <div className="global-board-progress" aria-label={`Avance ${value}%`}>
      <span style={{ width: `${value}%` }} />
      <strong>{value}%</strong>
    </div>
  );
}

function EntregaOrdenTrabajoModal({ orden, onClose, onSubmit }) {
  const [requiereGuia, setRequiereGuia] = useState(false);
  const [numeroGuia, setNumeroGuia] = useState('');
  const [observacionGuia, setObservacionGuia] = useState('');
  const [observacionEntrega, setObservacionEntrega] = useState('');
  const [numeroGuiaError, setNumeroGuiaError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNumeroGuiaError('');

    if (requiereGuia && !numeroGuia.trim()) {
      setNumeroGuiaError('Ingresa el numero de guia.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        requiere_guia_entrega: requiereGuia,
        numero_guia_entrega: requiereGuia ? numeroGuia.trim() : null,
        observacion_guia_entrega: requiereGuia ? observacionGuia.trim() || null : null,
        observacion_entrega: observacionEntrega.trim() || null,
      });
    } catch (err) {
      setError(err.message || 'No se pudo confirmar la entrega.');
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Registrar entrega"
      onClose={onClose}
      closeDisabled={saving}
      headerMeta={<Badge tone="success">100%</Badge>}
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <div className="delivery-order-context">
          <span>Orden de trabajo</span>
          <strong>{formatOrderCode('OT', orden.codigo, orden.id)}</strong>
          <small>{orden.cliente_nombre}</small>
        </div>

        {orden.tiene_orden_compra && !orden.numero_orden_compra && (
          <div className="alert alert-warning">
            Esta orden requiere OC y todavia no tiene numero registrado.
          </div>
        )}

        <fieldset className="checkbox-panel delivery-guide-panel">
          <legend>Guia de remision</legend>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={requiereGuia}
              onChange={(event) => {
                setRequiereGuia(event.target.checked);
                setNumeroGuiaError('');
              }}
            />
            <span>Activar guia para despacho</span>
          </label>

          <div className="delivery-guide-fields">
            <Input
              label="Numero de guia"
              name="numero_guia_entrega"
              value={numeroGuia}
              onChange={(event) => {
                setNumeroGuia(event.target.value);
                setNumeroGuiaError('');
              }}
              placeholder="Ej: T001-00012345"
              disabled={!requiereGuia}
              error={numeroGuiaError}
            />
            <label className="field">
              <span className="field-label">Observacion guia</span>
              <input
                className="input"
                value={observacionGuia}
                onChange={(event) => setObservacionGuia(event.target.value)}
                placeholder="Opcional"
                disabled={!requiereGuia}
              />
            </label>
          </div>
        </fieldset>

        <label className="field">
          <span className="field-label">Observacion entrega</span>
          <textarea
            className="input textarea"
            value={observacionEntrega}
            onChange={(event) => setObservacionEntrega(event.target.value)}
            placeholder="Opcional"
            rows={3}
          />
        </label>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" variant="success" disabled={saving}>
            {saving ? 'Confirmando...' : 'Confirmar entrega'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function getOpenIncidencias(incidencias) {
  return asArray(incidencias).filter((incidencia) => incidencia.estado !== 'RESUELTA');
}

function isAdminProcess(tipoProceso) {
  const normalized = normalize(tipoProceso);
  return normalized.startsWith('dise') || normalized === 'placas';
}

function getAdminProcesses(produccion) {
  return asArray(produccion.procesos).filter((proceso) => isAdminProcess(proceso.tipo_proceso));
}

function hasPendingAdminProcesses(produccion) {
  return getAdminProcesses(produccion).some((proceso) => proceso.estado !== 'TERMINADO');
}

function canStartProcess(procesos, proceso) {
  const index = procesos.findIndex((item) => item.id === proceso.id);
  if (index <= 0) return true;
  return procesos[index - 1]?.estado === 'TERMINADO';
}

function ProductionMiniRow({
  produccion,
  catalogs,
  fallbackCliente,
  incidencias = [],
  onOpenAdminControl,
}) {
  const material = catalogs.materiales[produccion.material_id]?.nombre || '-';
  const formato = catalogs.formatos[produccion.formato_id]?.nombre || '-';
  const cliente = catalogs.clientes[produccion.cliente_id]?.nombre || fallbackCliente || `Cliente #${produccion.cliente_id}`;
  const maquina = catalogs.maquinas[produccion.maquina_id]?.nombre || 'Sin maquina';
  const entrega = formatLocalDateTimeParts(produccion.fecha_entrega_estimada || produccion.fecha_entrega);
  const procesos = asArray(produccion.procesos);
  const estadoProduccion = getProductionStatusFromProcesses(procesos, produccion.estado);
  const procesoActual = getCurrentProcess(procesos);
  const abiertas = getOpenIncidencias(incidencias);
  const adminProcesses = getAdminProcesses(produccion);
  const hasAdminProcesses = adminProcesses.length > 0;
  const adminControlPending = adminProcesses.some((proceso) => proceso.estado !== 'TERMINADO');

  return (
    <div className={`production-board-row ${abiertas.length ? 'production-board-row-alert' : ''}`}>
      <div>
        <span>Orden</span>
        <strong>{formatOrderCode('OP', produccion.codigo, produccion.id)}</strong>
        <Badge tone={getStatusTone(estadoProduccion)}>{formatStatus(estadoProduccion)}</Badge>
        {abiertas.length > 0 && (
          <Badge tone="danger">{abiertas.length} incidencia{abiertas.length > 1 ? 's' : ''}</Badge>
        )}
      </div>
      <div>
        <span>Proceso actual</span>
        <strong>{procesoActual?.tipo_proceso || '-'}</strong>
        {procesoActual && <small>{formatStatus(procesoActual.estado)}</small>}
      </div>
      <div>
        <span>Entrega</span>
        <strong>{entrega.date}</strong>
        {entrega.time && <small>{entrega.time}</small>}
      </div>
      <div>
        <span>Cliente</span>
        <strong>{cliente}</strong>
      </div>
      <div>
        <span>Trabajo</span>
        <strong>{produccion.descripcion || 'Sin descripcion'}</strong>
      </div>
      <div>
        <span>Cantidad</span>
        <strong>{formatNumber(produccion.cantidad)}{produccion.demasia ? ` +${formatNumber(produccion.demasia)}` : ''}</strong>
      </div>
      <div>
        <span>Formato</span>
        <strong>{formato}</strong>
        <small>{material}</small>
      </div>
      <div>
        <span>Impresion</span>
        <strong>{produccion.tipo_impresion || '-'}</strong>
      </div>
      <div>
        <span>Color</span>
        <strong>{produccion.modo_color || '-'}</strong>
      </div>
      <div>
        <span>Maquina</span>
        <strong>{maquina}</strong>
      </div>
      <div className="production-board-actions">
        <span>Admin</span>
        {hasAdminProcesses ? (
          <Button size="sm" variant="outline" onClick={() => onOpenAdminControl?.(produccion, fallbackCliente)}>
            {adminControlPending ? 'Control' : 'Ver'}
          </Button>
        ) : (
          <small>-</small>
        )}
      </div>
    </div>
  );
}

export default function PizarraGlobal() {
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [ordenesProduccion, setOrdenesProduccion] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [originFilter, setOriginFilter] = useState('TODOS');
  const [statusFilter, setStatusFilter] = useState('ACTIVOS');
  const [rowLimit, setRowLimit] = useState(10);
  const [controlTarget, setControlTarget] = useState(null);
  const [processActionLoading, setProcessActionLoading] = useState('');
  const [deliveryTarget, setDeliveryTarget] = useState(null);

  const loadBoard = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const [
        trabajosData,
        produccionesData,
        incidenciasData,
        clientesData,
        materialesData,
        formatosData,
        maquinasData,
      ] = await Promise.all([
        ordenesTrabajoService.listarOrdenesTrabajo(),
        ordenesProduccionService.listarOrdenesProduccion(),
        incidenciasService.listarIncidencias(),
        clientesService.listar(),
        materialesService.listar(),
        formatosService.listar(),
        maquinasService.listar(),
      ]);

      setOrdenesTrabajo(asArray(trabajosData));
      setOrdenesProduccion(asArray(produccionesData));
      setIncidencias(asArray(incidenciasData));
      setClientes(asArray(clientesData));
      setMateriales(asArray(materialesData));
      setFormatos(asArray(formatosData));
      setMaquinas(asArray(maquinasData));
    } catch (err) {
      if (!silent) {
        setError(err.message || 'No se pudo cargar la pizarra global.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadBoard();
    const intervalId = window.setInterval(() => {
      loadBoard({ silent: true });
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  const catalogs = useMemo(() => ({
    clientes: indexById(clientes),
    materiales: indexById(materiales),
    formatos: indexById(formatos),
    maquinas: indexById(maquinas),
  }), [clientes, materiales, formatos, maquinas]);

  const grouped = useMemo(() => {
    const incidenciasByProduction = getOpenIncidencias(incidencias).reduce((acc, incidencia) => {
      if (incidencia.orden_produccion_id) {
        const key = String(incidencia.orden_produccion_id);
        acc[key] = acc[key] || [];
        acc[key].push(incidencia);
      }
      return acc;
    }, {});

    const productionsByWork = ordenesProduccion.reduce((acc, produccion) => {
      if (produccion.orden_trabajo_id) {
        const key = String(produccion.orden_trabajo_id);
        acc[key] = acc[key] || [];
        acc[key].push(produccion);
      }
      return acc;
    }, {});

    const query = normalize(search);
    const workRows = ordenesTrabajo.map((orden) => {
      const producciones = (productionsByWork[String(orden.id)] || asArray(orden.ordenes_produccion)).map((produccion) => ({
        ...produccion,
        incidencias_abiertas: incidenciasByProduction[String(produccion.id)] || [],
      }));
      const cliente = catalogs.clientes[orden.cliente_id];
      return {
        ...orden,
        cliente_nombre: cliente?.nombre || `Cliente #${orden.cliente_id}`,
        producciones,
        incidencias_abiertas_count: producciones.reduce((total, produccion) => (
          total + asArray(produccion.incidencias_abiertas).length
        ), 0),
        progress: getProgress(producciones),
      };
    });

    const filteredWorkRows = workRows.filter((orden) => {
      if (originFilter === 'SERVICIO') return false;
      const text = normalize(`${orden.codigo} ${orden.nombre} ${orden.descripcion} ${orden.cliente_nombre}`);
      return text.includes(query) && matchesStatusFilter(orden.estado, statusFilter);
    });

    const directProductions = ordenesProduccion
      .filter((produccion) => !produccion.orden_trabajo_id || produccion.tipo_origen === 'SERVICIO')
      .map((produccion) => ({
        ...produccion,
        cliente_nombre: catalogs.clientes[produccion.cliente_id]?.nombre || `Cliente #${produccion.cliente_id}`,
        incidencias_abiertas: incidenciasByProduction[String(produccion.id)] || [],
      }))
      .filter((produccion) => {
        if (originFilter === 'TRABAJO') return false;
        const text = normalize(`${produccion.codigo} ${produccion.descripcion} ${produccion.cliente_nombre}`);
        const estadoProduccion = getProductionStatusFromProcesses(produccion.procesos, produccion.estado);
        return text.includes(query) && matchesStatusFilter(estadoProduccion, statusFilter);
      });

    return { workRows: filteredWorkRows, directProductions };
  }, [catalogs, incidencias, ordenesProduccion, ordenesTrabajo, originFilter, search, statusFilter]);

  const toggleExpanded = (id) => {
    setExpanded((current) => ({ ...current, [id]: !current[id] }));
  };

  const openAdminControl = (produccion, fallbackCliente = '') => {
    setControlTarget({
      produccion,
      fallbackCliente,
      error: '',
    });
  };

  const handleAdminProcessAction = async (produccionId, tipoProceso, accion) => {
    const loadingKey = `${produccionId}-${tipoProceso}-${accion}`;
    setProcessActionLoading(loadingKey);
    setControlTarget((current) => (current ? { ...current, error: '' } : current));

    try {
      const tipoProcesoPath = encodeURIComponent(tipoProceso);
      const procesoActualizado = await apiFetch(`/ordenes-produccion/${produccionId}/procesos/${tipoProcesoPath}/${accion}`, {
        method: 'PUT',
      });

      setControlTarget((current) => {
        if (!current || current.produccion.id !== produccionId) return current;
        const procesos = asArray(current.produccion.procesos).map((proceso) => (
          proceso.id === procesoActualizado.id ? procesoActualizado : proceso
        ));
        return {
          ...current,
          produccion: {
            ...current.produccion,
            procesos,
            estado: getProductionStatusFromProcesses(procesos, current.produccion.estado),
          },
        };
      });

      await loadBoard({ silent: true });
    } catch (err) {
      setControlTarget((current) => (
        current ? { ...current, error: err.message || 'No se pudo actualizar el proceso.' } : current
      ));
    } finally {
      setProcessActionLoading('');
    }
  };

  const handleEntregarOrdenTrabajo = async (payload) => {
    if (!deliveryTarget) return;
    await ordenesTrabajoService.entregarOrdenTrabajo(deliveryTarget.id, payload);
    setDeliveryTarget(null);
    await loadBoard({ silent: true });
  };

  const renderAdminControlModal = () => {
    if (!controlTarget) return null;

    const { produccion, fallbackCliente, error: controlError } = controlTarget;
    const material = catalogs.materiales[produccion.material_id]?.nombre || '-';
    const formato = catalogs.formatos[produccion.formato_id]?.nombre || '-';
    const cliente = catalogs.clientes[produccion.cliente_id]?.nombre || fallbackCliente || `Cliente #${produccion.cliente_id}`;
    const maquina = catalogs.maquinas[produccion.maquina_id]?.nombre || 'Sin maquina';
    const procesos = asArray(produccion.procesos);
    const procesosAdmin = procesos.filter((proceso) => isAdminProcess(proceso.tipo_proceso));
    const adminControlPending = hasPendingAdminProcesses(produccion);

    return (
      <Modal
        title={adminControlPending ? 'Control administrativo' : 'Detalle administrativo'}
        onClose={() => setControlTarget(null)}
        panelClassName="modal-panel-wide admin-process-modal"
        headerMeta={<Badge tone={getStatusTone(produccion.estado)}>{formatStatus(produccion.estado)}</Badge>}
      >
        <div className="admin-process-layout">
          <section className="admin-process-summary">
            <h3>{formatOrderCode('OP', produccion.codigo, produccion.id)}</h3>
            <p>{produccion.descripcion || 'Sin descripcion'}</p>
            <dl>
              <div><dt>Cliente</dt><dd>{cliente}</dd></div>
              <div><dt>Cantidad</dt><dd>{formatNumber(produccion.cantidad)}</dd></div>
              <div><dt>Entrega</dt><dd>{formatLocalDateTime(produccion.fecha_entrega_estimada)}</dd></div>
              <div><dt>Formato</dt><dd>{formato}</dd></div>
              <div><dt>Material</dt><dd>{material}</dd></div>
              <div><dt>Maquina</dt><dd>{maquina}</dd></div>
              <div><dt>Color</dt><dd>{produccion.modo_color || '-'}</dd></div>
            </dl>
          </section>

          <section className="admin-process-controls">
            <h3>Procesos de administracion</h3>
            {controlError && <div className="alert alert-danger">{controlError}</div>}
            <div className="admin-process-list">
              {procesosAdmin.map((proceso) => {
                const previousIndex = procesos.findIndex((item) => item.id === proceso.id) - 1;
                const previousProcess = previousIndex >= 0 ? procesos[previousIndex] : null;
                const canStart = canStartProcess(procesos, proceso);
                const loading = Boolean(processActionLoading);

                return (
                  <article key={proceso.id} className="admin-process-card">
                    <div>
                      <strong>{proceso.tipo_proceso}</strong>
                      <Badge tone={getStatusTone(proceso.estado)}>{formatStatus(proceso.estado)}</Badge>
                    </div>
                    {!canStart && proceso.estado === 'PENDIENTE' && (
                      <p>Esperando que termine {previousProcess?.tipo_proceso}.</p>
                    )}
                    <div className="admin-process-actions">
                      {proceso.estado === 'PENDIENTE' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleAdminProcessAction(produccion.id, proceso.tipo_proceso, 'iniciar')}
                          disabled={loading || !canStart}
                        >
                          Iniciar
                        </Button>
                      )}
                      {proceso.estado === 'EN_PROCESO' && (
                        <>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleAdminProcessAction(produccion.id, proceso.tipo_proceso, 'pausar')}
                            disabled={loading}
                          >
                            Pausar
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleAdminProcessAction(produccion.id, proceso.tipo_proceso, 'finalizar')}
                            disabled={loading}
                          >
                            Finalizar
                          </Button>
                        </>
                      )}
                      {proceso.estado === 'PAUSADO' && (
                        <Button
                          size="sm"
                          onClick={() => handleAdminProcessAction(produccion.id, proceso.tipo_proceso, 'reanudar')}
                          disabled={loading}
                        >
                          Reanudar
                        </Button>
                      )}
                      {proceso.estado === 'TERMINADO' && (
                        <Badge tone="success">Cerrado</Badge>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </Modal>
    );
  };

  const boardRows = [
    ...grouped.workRows.map((orden) => ({ type: 'trabajo', id: `trabajo-${orden.id}`, data: orden })),
    ...grouped.directProductions.map((produccion) => ({ type: 'servicio', id: `servicio-${produccion.id}`, data: produccion })),
  ];
  const visibleBoardRows = boardRows.slice(0, rowLimit);

  return (
    <div className="page-stack fade-in">
      <section className="panel global-board-panel">
        <div className="section-heading">
          <div>
            <h2>Pizarra Global</h2>
            <p>Seguimiento de ordenes de trabajo y produccion</p>
          </div>
          <div className="section-actions">
            <Button
              className="icon-button"
              variant="outline"
              onClick={() => loadBoard()}
              disabled={loading}
              aria-label="Refrescar"
              title="Refrescar"
            >
              <svg className="refresh-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M20 12a8 8 0 0 1-13.4 5.9l-1.9-1.9H8v-2H1v7h2v-3.4l2.2 2.2A10 10 0 0 0 22 12h-2ZM4 12A8 8 0 0 1 17.4 6.1l1.9 1.9H16v2h7V3h-2v3.4l-2.2-2.2A10 10 0 0 0 2 12h2Z"
                  fill="currentColor"
                />
              </svg>
            </Button>
          </div>
        </div>

        <div className="global-board-filters">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por cliente, trabajo, codigo o descripcion..."
            aria-label="Buscar en pizarra"
          />
          <Select value={originFilter} onChange={(event) => setOriginFilter(event.target.value)} aria-label="Filtrar origen">
            <option value="TODOS">Todos</option>
            <option value="TRABAJO">Ordenes de trabajo</option>
            <option value="SERVICIO">Servicio directo</option>
          </Select>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar estado">
            <option value="TODOS">Todos</option>
            <option value="ACTIVOS">Activos</option>
            <option value="TERMINADOS">Terminados</option>
          </Select>
          <Select
            value={rowLimit}
            onChange={(event) => setRowLimit(Number(event.target.value))}
            aria-label="Limite de registros"
          >
            <option value={5}>5 por bloque</option>
            <option value={10}>10 por bloque</option>
            <option value={15}>15 por bloque</option>
            <option value={20}>20 por bloque</option>
          </Select>
        </div>

        {loading ? (
          <p className="muted">Cargando pizarra...</p>
        ) : error ? (
          <div className="alert alert-danger">
            {error}
            <div className="form-actions">
              <Button variant="outline" onClick={() => loadBoard()}>Reintentar</Button>
            </div>
          </div>
        ) : (
          <div className="global-board">
            <div className="global-board-group">
              <div className="global-board-group-title">
                <h3>Cola de produccion</h3>
                <span>Mostrando {Math.min(rowLimit, boardRows.length)} de {boardRows.length}</span>
              </div>

              {boardRows.length === 0 ? (
                <div className="empty-state">
                  <strong>Sin ordenes para mostrar</strong>
                  <p>Ajusta los filtros o sincroniza nuevamente.</p>
                </div>
              ) : (
                <div className="global-board-list">
                  {visibleBoardRows.map((row) => (
                    row.type === 'trabajo' ? (
                      <article key={row.id} className="work-order-row">
                        <div
                          role="button"
                          tabIndex={0}
                          className="work-order-summary"
                          onClick={() => toggleExpanded(row.data.id)}
                          onKeyDown={(event) => {
                            if (event.target.closest('button')) return;
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              toggleExpanded(row.data.id);
                            }
                          }}
                          aria-expanded={Boolean(expanded[row.data.id])}
                        >
                          <span className={`row-chevron ${expanded[row.data.id] ? 'row-chevron-open' : ''}`} />
                          <div className="work-order-code">
                            <span>Orden</span>
                            <strong>{formatOrderCode('OT', row.data.codigo, row.data.id)}</strong>
                            <small>Entrega: {row.data.fecha_entrega_estimada || '-'}</small>
                          </div>
                          <div className="work-order-work">
                            <span>Trabajo</span>
                            <strong>{row.data.nombre || 'Orden de trabajo sin nombre'}</strong>
                            <small>{row.data.descripcion || 'Sin descripcion'}</small>
                          </div>
                          <div>
                            <span>Cliente</span>
                            <strong>{row.data.cliente_nombre}</strong>
                          </div>
                          <div>
                            <span>Producciones</span>
                            <strong>{row.data.producciones.length}</strong>
                          </div>
                          <div>
                            <span>Avance</span>
                            <ProgressBar value={row.data.progress} />
                          </div>
                          <div className="global-board-row-badges">
                            <Badge tone={getStatusTone(getWorkOrderBoardStatus(row.data))}>
                              {formatStatus(getWorkOrderBoardStatus(row.data))}
                            </Badge>
                            {row.data.incidencias_abiertas_count > 0 && (
                              <Badge tone="danger">{row.data.incidencias_abiertas_count} incidencia{row.data.incidencias_abiertas_count > 1 ? 's' : ''}</Badge>
                            )}
                            {row.data.progress === 100 && row.data.estado !== 'ENTREGADA' && (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDeliveryTarget(row.data);
                                }}
                              >
                                Entregar
                              </Button>
                            )}
                          </div>
                        </div>

                        {expanded[row.data.id] && (
                          <div className="work-order-productions">
                            {row.data.producciones.length === 0 ? (
                              <p className="muted">Esta orden aun no tiene producciones asociadas.</p>
                            ) : (
                              row.data.producciones.map((produccion) => (
                                <ProductionMiniRow
                                  key={produccion.id}
                                  produccion={produccion}
                                  catalogs={catalogs}
                                  fallbackCliente={row.data.cliente_nombre}
                                  incidencias={produccion.incidencias_abiertas}
                                  onOpenAdminControl={openAdminControl}
                                />
                              ))
                            )}
                          </div>
                        )}
                      </article>
                    ) : (
                      <article key={row.id} className="direct-production-row">
                        <ProductionMiniRow
                          produccion={row.data}
                          catalogs={catalogs}
                          fallbackCliente={row.data.cliente_nombre}
                          incidencias={row.data.incidencias_abiertas}
                          onOpenAdminControl={openAdminControl}
                        />
                      </article>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
      {renderAdminControlModal()}
      {deliveryTarget && (
        <EntregaOrdenTrabajoModal
          orden={deliveryTarget}
          onClose={() => setDeliveryTarget(null)}
          onSubmit={handleEntregarOrdenTrabajo}
        />
      )}
    </div>
  );
}
