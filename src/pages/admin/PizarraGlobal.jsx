import { useEffect, useMemo, useState } from 'react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import * as clientesService from '../../services/clientesService';
import * as formatosService from '../../services/formatosService';
import * as maquinasService from '../../services/maquinasService';
import * as materialesService from '../../services/materialesService';
import * as ordenesProduccionService from '../../services/ordenesProduccionService';
import * as ordenesTrabajoService from '../../services/ordenesTrabajoService';
import { formatNumber, formatStatus, getStatusTone } from '../../utils/formatters';

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

function matchesStatusFilter(status, filter) {
  if (filter === 'TODOS') return true;
  if (filter === 'ACTIVOS') return !['TERMINADO', 'ANULADA', 'INACTIVO'].includes(status);
  if (filter === 'TERMINADOS') return status === 'TERMINADO';
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

function ProductionMiniRow({ produccion, catalogs, fallbackCliente }) {
  const material = catalogs.materiales[produccion.material_id]?.nombre || '-';
  const formato = catalogs.formatos[produccion.formato_id]?.nombre || '-';
  const cliente = catalogs.clientes[produccion.cliente_id]?.nombre || fallbackCliente || `Cliente #${produccion.cliente_id}`;
  const maquina = catalogs.maquinas[produccion.maquina_id]?.nombre || 'Sin maquina';
  const entrega = produccion.fecha_entrega_estimada || produccion.fecha_entrega || '-';

  return (
    <div className="production-board-row">
      <div>
        <span>Orden</span>
        <strong>{produccion.codigo || `OP-${produccion.id}`}</strong>
        <small>{formatStatus(produccion.estado)}</small>
      </div>
      <div>
        <span>Entrega</span>
        <strong>{entrega}</strong>
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
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [originFilter, setOriginFilter] = useState('TODOS');
  const [statusFilter, setStatusFilter] = useState('ACTIVOS');
  const [rowLimit, setRowLimit] = useState(10);

  const loadBoard = async () => {
    setLoading(true);
    setError('');
    try {
      const [
        trabajosData,
        produccionesData,
        clientesData,
        materialesData,
        formatosData,
        maquinasData,
      ] = await Promise.all([
        ordenesTrabajoService.listarOrdenesTrabajo(),
        ordenesProduccionService.listarOrdenesProduccion(),
        clientesService.listar(),
        materialesService.listar(),
        formatosService.listar(),
        maquinasService.listar(),
      ]);

      setOrdenesTrabajo(asArray(trabajosData));
      setOrdenesProduccion(asArray(produccionesData));
      setClientes(asArray(clientesData));
      setMateriales(asArray(materialesData));
      setFormatos(asArray(formatosData));
      setMaquinas(asArray(maquinasData));
    } catch (err) {
      setError(err.message || 'No se pudo cargar la pizarra global.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBoard();
  }, []);

  const catalogs = useMemo(() => ({
    clientes: indexById(clientes),
    materiales: indexById(materiales),
    formatos: indexById(formatos),
    maquinas: indexById(maquinas),
  }), [clientes, materiales, formatos, maquinas]);

  const grouped = useMemo(() => {
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
      const producciones = productionsByWork[String(orden.id)] || asArray(orden.ordenes_produccion);
      const cliente = catalogs.clientes[orden.cliente_id];
      return {
        ...orden,
        cliente_nombre: cliente?.nombre || `Cliente #${orden.cliente_id}`,
        producciones,
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
      }))
      .filter((produccion) => {
        if (originFilter === 'TRABAJO') return false;
        const text = normalize(`${produccion.codigo} ${produccion.descripcion} ${produccion.cliente_nombre}`);
        return text.includes(query) && matchesStatusFilter(produccion.estado, statusFilter);
      });

    return { workRows: filteredWorkRows, directProductions };
  }, [catalogs, ordenesProduccion, ordenesTrabajo, originFilter, search, statusFilter]);

  const toggleExpanded = (id) => {
    setExpanded((current) => ({ ...current, [id]: !current[id] }));
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
              onClick={loadBoard}
              disabled={loading}
              aria-label="Refrescar"
              title="Refrescar"
            >
              ↻
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
              <Button variant="outline" onClick={loadBoard}>Reintentar</Button>
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
                        <button
                          type="button"
                          className="work-order-summary"
                          onClick={() => toggleExpanded(row.data.id)}
                          aria-expanded={Boolean(expanded[row.data.id])}
                        >
                          <span className={`row-chevron ${expanded[row.data.id] ? 'row-chevron-open' : ''}`} />
                          <div className="work-order-main">
                            <strong>{row.data.codigo || `OT-${row.data.id}`}</strong>
                            <span>{row.data.nombre || 'Orden de trabajo sin nombre'}</span>
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
                          <Badge tone={getStatusTone(row.data.estado)}>{formatStatus(row.data.estado)}</Badge>
                        </button>

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
    </div>
  );
}
