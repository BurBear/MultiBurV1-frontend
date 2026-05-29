import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SummaryCard from '../../components/dashboard/SummaryCard';
import BrandLogo from '../../components/brand/BrandLogo';
import * as clientesService from '../../services/clientesService';
import * as formatosService from '../../services/formatosService';
import * as incidenciasService from '../../services/incidenciasService';
import * as maquinasService from '../../services/maquinasService';
import * as materialesService from '../../services/materialesService';
import * as ordenesProduccionService from '../../services/ordenesProduccionService';
import * as ordenesTrabajoService from '../../services/ordenesTrabajoService';
import { formatLocalDateTime } from '../../utils/datetime';
import { formatNumber, formatOrderCode, formatStatus, getStatusTone } from '../../utils/formatters';
import { getProcessArea } from '../../utils/procesos';

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function sameId(a, b) {
  return a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);
}

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function clienteLabel(cliente) {
  return [cliente.nombre, cliente.documento].filter(Boolean).join(' - ');
}

function indexById(items) {
  return asArray(items).reduce((acc, item) => {
    acc[String(item.id)] = item;
    return acc;
  }, {});
}

function getFromMap(map, id, fallback = null) {
  if (id === null || id === undefined) return fallback;
  return map[String(id)] || fallback;
}

function getCatalogName(map, id, fallback = '-') {
  const item = getFromMap(map, id);
  return item?.nombre || item?.codigo || fallback;
}

function isWithinDateRange(value, from, to) {
  if (!value || (!from && !to)) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  if (from) {
    const fromDate = new Date(`${from}T00:00:00`);
    if (date < fromDate) return false;
  }
  if (to) {
    const toDate = new Date(`${to}T23:59:59`);
    if (date > toDate) return false;
  }
  return true;
}

function getProduccionStatus(produccion) {
  const procesos = asArray(produccion.procesos);
  if (!procesos.length) return produccion.estado || 'PENDIENTE';
  if (procesos.every((proceso) => proceso.estado === 'TERMINADO')) return 'TERMINADO';
  if (procesos.some((proceso) => proceso.estado === 'EN_PROCESO')) return 'EN_PROCESO';
  if (procesos.some((proceso) => proceso.estado === 'PAUSADO')) return 'PAUSADO';
  return produccion.estado || 'PENDIENTE';
}

function getProgress(producciones) {
  const procesos = producciones.flatMap((produccion) => asArray(produccion.procesos));
  if (!procesos.length) return 0;
  const terminados = procesos.filter((proceso) => proceso.estado === 'TERMINADO').length;
  return Math.round((terminados / procesos.length) * 100);
}

function getImpresionProceso(produccion) {
  return asArray(produccion.procesos).find((proceso) => proceso.tipo_proceso === 'IMPRESION') || null;
}

function getProcesoActual(produccion) {
  const procesos = asArray(produccion.procesos);
  return (
    procesos.find((proceso) => proceso.estado === 'EN_PROCESO')
    || procesos.find((proceso) => proceso.estado === 'PAUSADO')
    || procesos.find((proceso) => proceso.estado === 'PENDIENTE')
    || procesos[procesos.length - 1]
    || null
  );
}

function sumBy(items, selector) {
  return items.reduce((total, item) => total + Number(selector(item) || 0), 0);
}

function formatQuantity(produccion) {
  const cantidad = formatNumber(produccion.cantidad);
  return produccion.demasia ? `${cantidad} + ${formatNumber(produccion.demasia)}` : cantidad;
}

function formatProcessQuantity(value) {
  if (value === null || value === undefined || value === '') return '-';
  return formatNumber(value);
}

function getProcesoRol(proceso) {
  const area = getProcessArea(proceso);
  if (area === 'IMPRESION') return 'Operador';
  if (area === 'ACABADOS') return 'Acabados';
  if (area === 'DISEÑO' || area === 'DISEÃ‘O' || area === 'PLACAS') return 'Admin';
  return area || '-';
}

function getProcesoResponsable(proceso) {
  if (proceso.operador_nombre) return proceso.operador_nombre;
  if (proceso.usuario_nombre) return proceso.usuario_nombre;
  if (proceso.admin_nombre) return proceso.admin_nombre;
  if (proceso.operador_id) return `Usuario #${proceso.operador_id}`;
  return '-';
}

function SimpleReportTable({ columns, rows, emptyText = 'Sin datos para mostrar.' }) {
  if (!rows.length) {
    return <div className="empty-state compact">{emptyText}</div>;
  }

  return (
    <div className="table-wrap report-table-wrap">
      <table className="crud-table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportClientSearch({ clientes, value, onChange }) {
  const selectedCliente = clientes.find((cliente) => sameId(cliente.id, value));
  const selectedLabel = value === 'TODOS' ? 'Todos los clientes' : selectedCliente ? clienteLabel(selectedCliente) : '';
  const [draftQuery, setDraftQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const inputValue = isEditing ? draftQuery : selectedLabel;

  const filteredClientes = useMemo(() => {
    const search = normalizeSearch(isEditing ? draftQuery : '');
    if (!search) return clientes.slice(0, 10);
    return clientes
      .filter((cliente) => normalizeSearch(clienteLabel(cliente)).includes(search))
      .slice(0, 10);
  }, [clientes, draftQuery, isEditing]);

  const selectCliente = (nextValue) => {
    onChange(nextValue);
    setDraftQuery('');
    setIsEditing(false);
    setOpen(false);
  };

  const handleChange = (event) => {
    const nextQuery = event.target.value;
    setDraftQuery(nextQuery);
    setIsEditing(true);
    setOpen(true);
    if (!nextQuery.trim()) {
      onChange('TODOS');
    }
  };

  return (
    <label className="field report-client-search-field">
      <span className="field-label">Cliente</span>
      <div className="report-client-combobox">
        <input
          className="input"
          type="search"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => {
            setIsEditing(true);
            setOpen(true);
            setDraftQuery(value === 'TODOS' ? '' : selectedLabel);
          }}
          onBlur={() => window.setTimeout(() => {
            setOpen(false);
            setIsEditing(false);
            setDraftQuery('');
          }, 120)}
          placeholder="Escribe nombre o documento"
          autoComplete="off"
        />
        {!open && (
          <span className="report-client-search-hint">Click para buscar</span>
        )}
        {open && (
          <div className="report-client-results">
            <button
              type="button"
              className={`report-client-option ${value === 'TODOS' ? 'report-client-option-active' : ''}`}
              onMouseDown={(event) => {
                event.preventDefault();
                selectCliente('TODOS');
              }}
            >
              <strong>Todos los clientes</strong>
              <span>Sin filtro de cliente</span>
            </button>

            {filteredClientes.map((cliente) => (
              <button
                key={cliente.id}
                type="button"
                className={`report-client-option ${sameId(cliente.id, value) ? 'report-client-option-active' : ''}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectCliente(cliente.id);
                }}
              >
                <strong>{cliente.nombre}</strong>
                <span>{cliente.documento || 'Sin documento'}</span>
              </button>
            ))}

            {filteredClientes.length === 0 && (
              <div className="report-client-empty">No se encontraron clientes.</div>
            )}
          </div>
        )}
      </div>
    </label>
  );
}

function PrintTable({ columns, rows, emptyText = 'Sin datos para mostrar.' }) {
  return (
    <table className="print-table">
      <thead>
        <tr>
          {columns.map((column) => <th key={column.key}>{column.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length ? rows.map((row) => (
          <tr key={row.id}>
            {columns.map((column) => (
              <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
            ))}
          </tr>
        )) : (
          <tr>
            <td colSpan={columns.length}>{emptyText}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function ReportesPrintDocument({ report, clienteLabel, fromDate, toDate }) {
  const rangeLabel = fromDate || toDate
    ? `${fromDate || 'Inicio'} - ${toDate || 'Hoy'}`
    : 'Todos los registros';

  return (
    <article className="print-document" aria-hidden="true">
      <header className="print-header">
        <div className="print-brand">
          <BrandLogo className="brand-logo-print" />
          <div>
            <h1>MultiBur</h1>
            <p>Reporte administrativo</p>
          </div>
        </div>
        <div className="print-header-code">
          <span>Fecha</span>
          <strong>{new Date().toLocaleDateString('es-PE')}</strong>
        </div>
      </header>

      <section className="print-title-block">
        <h2>Reportes</h2>
        <p>Cliente: {clienteLabel} | Periodo: {rangeLabel}</p>
      </section>

      <section className="print-grid">
        <div><span>Ordenes de trabajo</span><strong>{formatNumber(report.resumen.trabajos)}</strong></div>
        <div><span>Ordenes listas</span><strong>{formatNumber(report.resumen.listas)}</strong></div>
        <div><span>Ordenes entregadas</span><strong>{formatNumber(report.resumen.entregadas)}</strong></div>
        <div><span>Producciones</span><strong>{formatNumber(report.resumen.producciones)}</strong></div>
        <div><span>Cantidad planificada</span><strong>{formatNumber(report.resumen.cantidadPlanificada)}</strong></div>
        <div><span>Cantidad buena</span><strong>{formatNumber(report.resumen.cantidadBuena)}</strong></div>
        <div><span>Cantidad mala</span><strong>{formatNumber(report.resumen.cantidadMala)}</strong></div>
        <div><span>Merma</span><strong>{report.resumen.merma}%</strong></div>
        <div><span>Incidencias abiertas</span><strong>{formatNumber(report.resumen.incidenciasAbiertas)}</strong></div>
        <div><span>OC pendientes</span><strong>{formatNumber(report.resumen.ocPendientes)}</strong></div>
      </section>

      {report.isClientSelected && (
        <>
          <section className="print-section">
            <h3>Ordenes de trabajo del cliente</h3>
            <PrintTable
              columns={[
                { key: 'codigo', label: 'OT' },
                { key: 'nombre', label: 'Trabajo' },
                { key: 'entrega', label: 'Entrega' },
                { key: 'estado', label: 'Estado', render: (row) => formatStatus(row.estado) },
                { key: 'producciones', label: 'OP' },
                { key: 'oc', label: 'OC' },
              ]}
              rows={report.trabajos}
            />
          </section>

          <section className="print-section">
            <h3>Ordenes de produccion del cliente</h3>
            <PrintTable
              columns={[
                { key: 'codigo', label: 'OP' },
                { key: 'trabajo', label: 'Trabajo' },
                { key: 'ot', label: 'OT' },
                { key: 'material', label: 'Material' },
                { key: 'cantidad', label: 'Cantidad' },
                { key: 'estado', label: 'Estado', render: (row) => formatStatus(row.estado) },
                { key: 'procesoActual', label: 'Proceso actual' },
              ]}
              rows={report.producciones}
            />
          </section>

          <section className="print-section">
            <h3>Materiales frecuentes</h3>
            <PrintTable
              columns={[
                { key: 'material', label: 'Material' },
                { key: 'veces', label: 'Veces' },
                { key: 'cantidad', label: 'Planificado', render: (row) => formatNumber(row.cantidad) },
                { key: 'buena', label: 'Buena', render: (row) => formatNumber(row.buena) },
                { key: 'mala', label: 'Mala', render: (row) => formatNumber(row.mala) },
              ]}
              rows={report.materialesFrecuentes}
            />
          </section>

          <section className="print-section">
            <h3>Trazabilidad de procesos</h3>
            <PrintTable
              columns={[
                { key: 'op', label: 'OP' },
                { key: 'area', label: 'Area' },
                { key: 'proceso', label: 'Proceso' },
                { key: 'estado', label: 'Estado', render: (row) => formatStatus(row.estado) },
                { key: 'rol', label: 'Rol' },
                { key: 'inicio', label: 'Inicio' },
                { key: 'fin', label: 'Fin' },
                { key: 'buena', label: 'Buena' },
                { key: 'mala', label: 'Mala' },
              ]}
              rows={report.procesosDetalle}
            />
          </section>
        </>
      )}

      {!report.isClientSelected && (
        <>
          <section className="print-section">
            <h3>Estados de produccion</h3>
            <PrintTable
              columns={[
                { key: 'estado', label: 'Estado', render: (row) => formatStatus(row.estado) },
                { key: 'cantidad', label: 'OP' },
                { key: 'planificado', label: 'Cantidad', render: (row) => formatNumber(row.planificado) },
              ]}
              rows={report.estadosProduccion}
            />
          </section>

          <section className="print-section">
            <h3>Carga por proceso</h3>
            <PrintTable
              columns={[
                { key: 'proceso', label: 'Proceso' },
                { key: 'pendiente', label: 'Pendiente' },
                { key: 'enProceso', label: 'En proceso' },
                { key: 'pausado', label: 'Pausado' },
                { key: 'terminado', label: 'Terminado' },
              ]}
              rows={report.procesos}
            />
          </section>

          <section className="print-section">
            <h3>Entregas y documentos</h3>
            <PrintTable
              columns={[
                { key: 'codigo', label: 'OT' },
                { key: 'cliente', label: 'Cliente' },
                { key: 'estado', label: 'Estado', render: (row) => formatStatus(row.estado) },
                { key: 'entregaEstimada', label: 'Entrega estimada', render: (row) => row.entregaEstimada || '-' },
                { key: 'entregaReal', label: 'Entrega real', render: (row) => formatLocalDateTime(row.entregaReal) },
                { key: 'guia', label: 'Guia' },
                { key: 'oc', label: 'OC' },
              ]}
              rows={report.entregas}
            />
          </section>
        </>
      )}
    </article>
  );
}

export default function Reportes() {
  const [data, setData] = useState({
    clientes: [],
    ordenesTrabajo: [],
    ordenesProduccion: [],
    incidencias: [],
    materiales: [],
    formatos: [],
    maquinas: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clienteFilter, setClienteFilter] = useState('TODOS');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadReportes = async () => {
    setLoading(true);
    setError('');
    try {
      const [
        clientesData,
        trabajosData,
        produccionesData,
        incidenciasData,
        materialesData,
        formatosData,
        maquinasData,
      ] = await Promise.all([
        clientesService.listar(),
        ordenesTrabajoService.listarOrdenesTrabajo(),
        ordenesProduccionService.listarOrdenesProduccion(),
        incidenciasService.listarIncidencias(),
        materialesService.listar(),
        formatosService.listar(),
        maquinasService.listar(),
      ]);

      setData({
        clientes: asArray(clientesData),
        ordenesTrabajo: asArray(trabajosData),
        ordenesProduccion: asArray(produccionesData),
        incidencias: asArray(incidenciasData),
        materiales: asArray(materialesData),
        formatos: asArray(formatosData),
        maquinas: asArray(maquinasData),
      });
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los reportes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReportes();
  }, []);

  const selectedCliente = data.clientes.find((cliente) => sameId(cliente.id, clienteFilter));
  const clienteNombre = clienteFilter === 'TODOS' ? 'Todos los clientes' : selectedCliente?.nombre || `Cliente #${clienteFilter}`;

  const report = useMemo(() => {
    const clientesById = indexById(data.clientes);
    const materialesById = indexById(data.materiales);
    const formatosById = indexById(data.formatos);
    const maquinasById = indexById(data.maquinas);
    const trabajosById = indexById(data.ordenesTrabajo);
    const isClientSelected = clienteFilter !== 'TODOS';

    const producciones = data.ordenesProduccion
      .filter((produccion) => !isClientSelected || sameId(produccion.cliente_id, clienteFilter))
      .filter((produccion) => isWithinDateRange(produccion.fecha_entrega_estimada || produccion.created_at, fromDate, toDate));

    const produccionesByTrabajo = producciones.reduce((acc, produccion) => {
      if (produccion.orden_trabajo_id) {
        const key = String(produccion.orden_trabajo_id);
        acc[key] = acc[key] || [];
        acc[key].push(produccion);
      }
      return acc;
    }, {});

    const trabajos = data.ordenesTrabajo
      .filter((orden) => !isClientSelected || sameId(orden.cliente_id, clienteFilter))
      .filter((orden) => isWithinDateRange(orden.fecha_entrega_real || orden.fecha_entrega_estimada || orden.created_at, fromDate, toDate))
      .map((orden) => ({
        ...orden,
        producciones: produccionesByTrabajo[String(orden.id)] || asArray(orden.ordenes_produccion),
      }));

    const produccionIds = new Set(producciones.map((produccion) => String(produccion.id)));
    const trabajoIds = new Set(trabajos.map((orden) => String(orden.id)));
    const incidencias = data.incidencias.filter((incidencia) => (
      (incidencia.orden_produccion_id && produccionIds.has(String(incidencia.orden_produccion_id)))
      || ((incidencia.orden_id || incidencia.orden_trabajo_id) && trabajoIds.has(String(incidencia.orden_id || incidencia.orden_trabajo_id)))
    ));

    const cantidadPlanificada = sumBy(producciones, (produccion) => produccion.cantidad);
    const cantidadBuena = sumBy(producciones, (produccion) => getImpresionProceso(produccion)?.cantidad_buena);
    const cantidadMala = sumBy(producciones, (produccion) => getImpresionProceso(produccion)?.cantidad_mala);
    const incidenciasAbiertas = incidencias.filter((incidencia) => incidencia.estado !== 'RESUELTA').length;
    const ocPendientes = trabajos.filter((orden) => orden.tiene_orden_compra && !orden.numero_orden_compra).length;

    const resumen = {
      trabajos: trabajos.length,
      producciones: producciones.length,
      entregadas: trabajos.filter((orden) => orden.estado === 'ENTREGADA').length,
      listas: trabajos.filter((orden) => orden.estado !== 'ENTREGADA' && getProgress(orden.producciones) === 100).length,
      cantidadPlanificada,
      cantidadBuena,
      cantidadMala,
      merma: cantidadBuena + cantidadMala > 0 ? Math.round((cantidadMala / (cantidadBuena + cantidadMala)) * 100) : 0,
      incidenciasAbiertas,
      ocPendientes,
    };

    const estadosProduccion = ['PENDIENTE', 'EN_PROCESO', 'PAUSADO', 'TERMINADO'].map((estado) => {
      const rows = producciones.filter((produccion) => getProduccionStatus(produccion) === estado);
      return {
        id: estado,
        estado,
        cantidad: rows.length,
        planificado: sumBy(rows, (produccion) => produccion.cantidad),
      };
    }).filter((row) => row.cantidad > 0);

    const procesosMap = new Map();
    producciones.forEach((produccion) => {
      asArray(produccion.procesos).forEach((proceso) => {
        if (!procesosMap.has(proceso.tipo_proceso)) {
          procesosMap.set(proceso.tipo_proceso, {
            id: proceso.tipo_proceso,
            proceso: proceso.tipo_proceso,
            pendiente: 0,
            enProceso: 0,
            pausado: 0,
            terminado: 0,
          });
        }
        const row = procesosMap.get(proceso.tipo_proceso);
        if (proceso.estado === 'EN_PROCESO') row.enProceso += 1;
        else if (proceso.estado === 'PAUSADO') row.pausado += 1;
        else if (proceso.estado === 'TERMINADO') row.terminado += 1;
        else row.pendiente += 1;
      });
    });

    const trabajosDetalle = trabajos.map((orden) => ({
      id: orden.id,
      codigo: formatOrderCode('OT', orden.codigo, orden.id),
      nombre: orden.nombre || '-',
      descripcion: orden.descripcion || '-',
      cliente: getFromMap(clientesById, orden.cliente_id)?.nombre || `Cliente #${orden.cliente_id}`,
      entrega: orden.fecha_entrega_estimada || '-',
      estado: orden.estado,
      producciones: asArray(orden.producciones).length,
      avance: getProgress(asArray(orden.producciones)),
      oc: orden.tiene_orden_compra ? orden.numero_orden_compra || 'OC pendiente' : 'No requiere',
      guia: orden.numero_guia_entrega || '-',
    }));

    const produccionesDetalle = producciones.map((produccion) => {
      const procesoActual = getProcesoActual(produccion);
      const trabajo = getFromMap(trabajosById, produccion.orden_trabajo_id);
      return {
        id: produccion.id,
        codigo: formatOrderCode('OP', produccion.codigo, produccion.id),
        trabajo: produccion.descripcion || '-',
        ot: trabajo ? formatOrderCode('OT', trabajo.codigo, trabajo.id) : '-',
        cliente: getFromMap(clientesById, produccion.cliente_id)?.nombre || `Cliente #${produccion.cliente_id}`,
        entrega: formatLocalDateTime(produccion.fecha_entrega_estimada),
        material: getCatalogName(materialesById, produccion.material_id, 'Sin material'),
        formato: getCatalogName(formatosById, produccion.formato_id, '-'),
        maquina: getCatalogName(maquinasById, produccion.maquina_id, 'Sin maquina'),
        impresion: produccion.tipo_impresion || '-',
        color: produccion.modo_color || '-',
        cantidad: formatQuantity(produccion),
        estado: getProduccionStatus(produccion),
        procesoActual: procesoActual?.tipo_proceso || '-',
        procesoActualEstado: procesoActual?.estado || produccion.estado,
      };
    });

    const materialesFrecuentes = Array.from(producciones.reduce((acc, produccion) => {
      const key = produccion.material_id ? String(produccion.material_id) : 'SIN_MATERIAL';
      const material = getCatalogName(materialesById, produccion.material_id, 'Sin material');
      if (!acc.has(key)) {
        acc.set(key, {
          id: key,
          material,
          veces: 0,
          cantidad: 0,
          buena: 0,
          mala: 0,
        });
      }
      const row = acc.get(key);
      row.veces += 1;
      row.cantidad += Number(produccion.cantidad || 0);
      row.buena += Number(getImpresionProceso(produccion)?.cantidad_buena || 0);
      row.mala += Number(getImpresionProceso(produccion)?.cantidad_mala || 0);
      return acc;
    }, new Map()).values())
      .sort((a, b) => b.veces - a.veces || b.cantidad - a.cantidad);

    const procesosDetalle = producciones.flatMap((produccion) => {
      const trabajo = getFromMap(trabajosById, produccion.orden_trabajo_id);
      return asArray(produccion.procesos).map((proceso, index) => ({
        id: `${produccion.id}-${proceso.id || index}`,
        op: formatOrderCode('OP', produccion.codigo, produccion.id),
        ot: trabajo ? formatOrderCode('OT', trabajo.codigo, trabajo.id) : '-',
        trabajo: produccion.descripcion || '-',
        area: getProcessArea(proceso) || '-',
        proceso: proceso.tipo_proceso || '-',
        estado: proceso.estado || 'PENDIENTE',
        rol: getProcesoRol(proceso),
        responsable: getProcesoResponsable(proceso),
        inicio: formatLocalDateTime(proceso.fecha_inicio),
        fin: formatLocalDateTime(proceso.fecha_fin),
        buena: formatProcessQuantity(proceso.cantidad_buena),
        mala: formatProcessQuantity(proceso.cantidad_mala),
      }));
    });

    const movimientosProceso = producciones.flatMap((produccion) => {
      const trabajo = getFromMap(trabajosById, produccion.orden_trabajo_id);
      return asArray(produccion.procesos).flatMap((proceso, procesoIndex) => (
        asArray(proceso.historial).map((movimiento, movimientoIndex) => ({
          id: `${produccion.id}-${proceso.id || procesoIndex}-${movimiento.id || movimientoIndex}`,
          op: formatOrderCode('OP', produccion.codigo, produccion.id),
          ot: trabajo ? formatOrderCode('OT', trabajo.codigo, trabajo.id) : '-',
          proceso: proceso.tipo_proceso || '-',
          area: getProcessArea(proceso) || '-',
          accion: movimiento.accion || '-',
          fechaRaw: movimiento.fecha,
          fecha: formatLocalDateTime(movimiento.fecha),
          rol: getProcesoRol(proceso),
          responsable: movimiento.operador_nombre || getProcesoResponsable(proceso),
        }))
      ));
    }).sort((a, b) => new Date(b.fechaRaw || 0).getTime() - new Date(a.fechaRaw || 0).getTime());

    const entregas = trabajos
      .filter((orden) => orden.estado === 'ENTREGADA' || getProgress(orden.producciones) === 100)
      .map((orden) => ({
        id: orden.id,
        codigo: formatOrderCode('OT', orden.codigo, orden.id),
        cliente: getFromMap(clientesById, orden.cliente_id)?.nombre || `Cliente #${orden.cliente_id}`,
        estado: orden.estado === 'ENTREGADA' ? 'ENTREGADA' : 'LISTO',
        entregaEstimada: orden.fecha_entrega_estimada,
        entregaReal: orden.fecha_entrega_real,
        guia: orden.numero_guia_entrega || '-',
        oc: orden.tiene_orden_compra ? orden.numero_orden_compra || 'OC pendiente' : 'No requiere',
      }));

    return {
      isClientSelected,
      selectedCliente: isClientSelected ? getFromMap(clientesById, clienteFilter) : null,
      resumen,
      estadosProduccion,
      procesos: Array.from(procesosMap.values()).sort((a, b) => a.proceso.localeCompare(b.proceso)),
      trabajos: trabajosDetalle,
      producciones: produccionesDetalle,
      materialesFrecuentes,
      materialTop: materialesFrecuentes[0] || null,
      procesosDetalle,
      movimientosProceso,
      entregas,
    };
  }, [clienteFilter, data, fromDate, toDate]);

  const clearFilters = () => {
    setClienteFilter('TODOS');
    setFromDate('');
    setToDate('');
  };

  const handlePrintReport = () => {
    const previousTitle = document.title;
    document.title = 'Reportes_MultiBur';
    window.print();
    document.title = previousTitle;
  };

  return (
    <div className="page-stack fade-in">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Reportes</h2>
            <p>{loading ? 'Cargando datos...' : 'Analisis por cliente, produccion, materiales y trazabilidad'}</p>
          </div>
          <Button
            variant="outline"
            onClick={handlePrintReport}
            disabled={loading}
          >
            Imprimir / PDF
          </Button>
          <Button
            className="icon-button"
            variant="outline"
            onClick={loadReportes}
            disabled={loading}
            aria-label="Refrescar"
            title="Refrescar"
          >
            &#x21bb;
          </Button>
        </div>

        <div className="report-filters">
          <ReportClientSearch
            clientes={data.clientes}
            value={clienteFilter}
            onChange={setClienteFilter}
          />
          <label className="field">
            <span className="field-label">Desde</span>
            <input className="input" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Hasta</span>
            <input className="input" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </label>
          <Button variant="outline" onClick={clearFilters}>Limpiar</Button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="summary-grid report-summary-grid">
          <SummaryCard label="Ordenes de trabajo" value={loading ? '-' : formatNumber(report.resumen.trabajos)} />
          <SummaryCard label="Ordenes listas" value={loading ? '-' : formatNumber(report.resumen.listas)} hint="100% sin entregar" />
          <SummaryCard label="Ordenes entregadas" value={loading ? '-' : formatNumber(report.resumen.entregadas)} />
          <SummaryCard label="Producciones" value={loading ? '-' : formatNumber(report.resumen.producciones)} />
          <SummaryCard label="Cantidad planificada" value={loading ? '-' : formatNumber(report.resumen.cantidadPlanificada)} />
          <SummaryCard label="Cantidad buena" value={loading ? '-' : formatNumber(report.resumen.cantidadBuena)} />
          <SummaryCard label="Cantidad mala" value={loading ? '-' : formatNumber(report.resumen.cantidadMala)} hint={`${report.resumen.merma}% merma`} />
          <SummaryCard label="Incidencias abiertas" value={loading ? '-' : formatNumber(report.resumen.incidenciasAbiertas)} />
          <SummaryCard label="OC pendientes" value={loading ? '-' : formatNumber(report.resumen.ocPendientes)} />
        </div>
      </section>

      {report.isClientSelected ? (
        <>
          <section className="panel report-client-profile">
            <div className="section-heading">
              <div>
                <h2>{clienteNombre}</h2>
                <p>Resumen comercial, tecnico y operativo del cliente seleccionado.</p>
              </div>
              <Badge tone={report.selectedCliente?.requiere_orden_compra ? 'warning' : 'neutral'}>
                {report.selectedCliente?.requiere_orden_compra ? 'REQUIERE OC' : 'SIN OC'}
              </Badge>
            </div>

            <div className="report-client-meta">
              <div>
                <span>Documento</span>
                <strong>{report.selectedCliente?.documento || '-'}</strong>
              </div>
              <div>
                <span>Telefono</span>
                <strong>{report.selectedCliente?.telefono || '-'}</strong>
              </div>
              <div>
                <span>Correo</span>
                <strong>{report.selectedCliente?.correo || '-'}</strong>
              </div>
              <div>
                <span>Estado</span>
                <strong>{formatStatus(report.selectedCliente?.estado || 'ACTIVO')}</strong>
              </div>
            </div>

            <div className="report-insight-grid">
              <article className="report-insight-card report-material-highlight">
                <span>Material mas solicitado</span>
                <strong>{report.materialTop?.material || 'Sin material registrado'}</strong>
                <small>
                  {report.materialTop
                    ? `${formatNumber(report.materialTop.veces)} OP | ${formatNumber(report.materialTop.cantidad)} planificadas`
                    : 'Aun no hay producciones para calcular frecuencia.'}
                </small>
              </article>
              <article className="report-insight-card">
                <span>Registro de impresion</span>
                <strong>{formatNumber(report.resumen.cantidadBuena)} buenas / {formatNumber(report.resumen.cantidadMala)} malas</strong>
                <small>{report.resumen.merma}% de merma registrada</small>
              </article>
              <article className="report-insight-card">
                <span>Seguimiento documental</span>
                <strong>{formatNumber(report.resumen.ocPendientes)} OC pendientes</strong>
                <small>{formatNumber(report.resumen.entregadas)} ordenes entregadas</small>
              </article>
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Ordenes de trabajo</h2>
                <p>Trabajos registrados para {clienteNombre}.</p>
              </div>
            </div>
            <SimpleReportTable
              columns={[
                { key: 'codigo', label: 'OT' },
                { key: 'nombre', label: 'Trabajo' },
                { key: 'descripcion', label: 'Descripcion' },
                { key: 'entrega', label: 'Entrega' },
                { key: 'producciones', label: 'OP' },
                {
                  key: 'avance',
                  label: 'Avance',
                  render: (row) => `${row.avance}%`,
                },
                {
                  key: 'estado',
                  label: 'Estado',
                  render: (row) => <Badge tone={getStatusTone(row.estado)}>{formatStatus(row.estado)}</Badge>,
                },
                { key: 'oc', label: 'OC' },
                { key: 'guia', label: 'Guia' },
              ]}
              rows={report.trabajos}
              emptyText="Este cliente no tiene ordenes de trabajo en el periodo seleccionado."
            />
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Ordenes de produccion</h2>
                <p>Producciones del cliente con ficha tecnica y estado actual.</p>
              </div>
            </div>
            <SimpleReportTable
              columns={[
                { key: 'codigo', label: 'OP' },
                { key: 'trabajo', label: 'Trabajo' },
                { key: 'ot', label: 'OT' },
                { key: 'entrega', label: 'Entrega' },
                { key: 'material', label: 'Material' },
                { key: 'formato', label: 'Formato' },
                { key: 'impresion', label: 'Impresion' },
                { key: 'color', label: 'Color' },
                { key: 'maquina', label: 'Maquina' },
                { key: 'cantidad', label: 'Cantidad' },
                {
                  key: 'estado',
                  label: 'Estado',
                  render: (row) => <Badge tone={getStatusTone(row.estado)}>{formatStatus(row.estado)}</Badge>,
                },
                {
                  key: 'procesoActual',
                  label: 'Proceso actual',
                  render: (row) => (
                    <div className="report-badge-stack">
                      <strong>{row.procesoActual}</strong>
                      <Badge tone={getStatusTone(row.procesoActualEstado)}>{formatStatus(row.procesoActualEstado)}</Badge>
                    </div>
                  ),
                },
              ]}
              rows={report.producciones}
              emptyText="Este cliente no tiene ordenes de produccion en el periodo seleccionado."
            />
          </section>

          <div className="report-grid report-client-grid">
            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>Materiales frecuentes</h2>
                  <p>Materiales mas pedidos por cantidad de OP.</p>
                </div>
              </div>
              <SimpleReportTable
                columns={[
                  { key: 'material', label: 'Material' },
                  { key: 'veces', label: 'Veces' },
                  { key: 'cantidad', label: 'Planificado', render: (row) => formatNumber(row.cantidad) },
                  { key: 'buena', label: 'Buena', render: (row) => formatNumber(row.buena) },
                  { key: 'mala', label: 'Mala', render: (row) => formatNumber(row.mala) },
                ]}
                rows={report.materialesFrecuentes}
                emptyText="No hay materiales registrados para este cliente."
              />
            </section>

            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>Estados de produccion</h2>
                  <p>Distribucion de OP del cliente.</p>
                </div>
              </div>
              <SimpleReportTable
                columns={[
                  {
                    key: 'estado',
                    label: 'Estado',
                    render: (row) => <Badge tone={getStatusTone(row.estado)}>{formatStatus(row.estado)}</Badge>,
                  },
                  { key: 'cantidad', label: 'OP' },
                  { key: 'planificado', label: 'Cantidad', render: (row) => formatNumber(row.planificado) },
                ]}
                rows={report.estadosProduccion}
              />
            </section>
          </div>

          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Trazabilidad de procesos</h2>
                <p>Procesos realizados por administracion, impresion y acabados.</p>
              </div>
            </div>
            <SimpleReportTable
              columns={[
                { key: 'op', label: 'OP' },
                { key: 'ot', label: 'OT' },
                { key: 'trabajo', label: 'Trabajo' },
                { key: 'area', label: 'Area' },
                { key: 'proceso', label: 'Proceso' },
                {
                  key: 'estado',
                  label: 'Estado',
                  render: (row) => <Badge tone={getStatusTone(row.estado)}>{formatStatus(row.estado)}</Badge>,
                },
                { key: 'rol', label: 'Rol' },
                { key: 'responsable', label: 'Responsable' },
                { key: 'inicio', label: 'Inicio' },
                { key: 'fin', label: 'Fin' },
                { key: 'buena', label: 'Buena' },
                { key: 'mala', label: 'Mala' },
              ]}
              rows={report.procesosDetalle}
              emptyText="No hay procesos registrados para este cliente."
            />
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Movimientos registrados</h2>
                <p>Acciones registradas al iniciar, pausar, reanudar, finalizar o reabrir procesos.</p>
              </div>
            </div>
            <SimpleReportTable
              columns={[
                { key: 'fecha', label: 'Fecha' },
                { key: 'op', label: 'OP' },
                { key: 'ot', label: 'OT' },
                { key: 'area', label: 'Area' },
                { key: 'proceso', label: 'Proceso' },
                { key: 'accion', label: 'Accion' },
                { key: 'rol', label: 'Rol' },
                { key: 'responsable', label: 'Responsable' },
              ]}
              rows={report.movimientosProceso}
              emptyText="No hay movimientos registrados para este cliente."
            />
          </section>
        </>
      ) : (
        <>
          <section className="panel report-guidance">
            <div>
              <h2>Selecciona un cliente para analizarlo a detalle</h2>
              <p>
                El reporte detallado muestra sus ordenes de trabajo, ordenes de produccion,
                material mas solicitado, trazabilidad de procesos y movimientos hechos por admin,
                operador y acabados.
              </p>
            </div>
            <Badge tone="info">Vista general activa</Badge>
          </section>

          <div className="report-grid">
            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>Estados de produccion</h2>
                  <p>Distribucion actual de las OP.</p>
                </div>
              </div>
              <SimpleReportTable
                columns={[
                  {
                    key: 'estado',
                    label: 'Estado',
                    render: (row) => <Badge tone={getStatusTone(row.estado)}>{formatStatus(row.estado)}</Badge>,
                  },
                  { key: 'cantidad', label: 'OP' },
                  { key: 'planificado', label: 'Cantidad', render: (row) => formatNumber(row.planificado) },
                ]}
                rows={report.estadosProduccion}
              />
            </section>

            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>Carga por proceso</h2>
                  <p>Seguimiento de diseno, placas, impresion y acabados.</p>
                </div>
              </div>
              <SimpleReportTable
                columns={[
                  { key: 'proceso', label: 'Proceso' },
                  { key: 'pendiente', label: 'Pendiente' },
                  { key: 'enProceso', label: 'En proceso' },
                  { key: 'pausado', label: 'Pausado' },
                  { key: 'terminado', label: 'Terminado' },
                ]}
                rows={report.procesos}
              />
            </section>
          </div>

          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Entregas y documentos</h2>
                <p>Ordenes listas o entregadas, con guia y OC asociada.</p>
              </div>
            </div>
            <SimpleReportTable
              columns={[
                { key: 'codigo', label: 'OT' },
                { key: 'cliente', label: 'Cliente' },
                {
                  key: 'estado',
                  label: 'Estado',
                  render: (row) => <Badge tone={getStatusTone(row.estado)}>{formatStatus(row.estado)}</Badge>,
                },
                { key: 'entregaEstimada', label: 'Entrega estimada', render: (row) => row.entregaEstimada || '-' },
                { key: 'entregaReal', label: 'Entrega real', render: (row) => formatLocalDateTime(row.entregaReal) },
                { key: 'guia', label: 'Guia' },
                { key: 'oc', label: 'OC' },
              ]}
              rows={report.entregas}
            />
          </section>
        </>
      )}

      {!loading && !error && (
        <ReportesPrintDocument
          report={report}
          clienteLabel={clienteNombre}
          fromDate={fromDate}
          toDate={toDate}
        />
      )}
    </div>
  );
}
