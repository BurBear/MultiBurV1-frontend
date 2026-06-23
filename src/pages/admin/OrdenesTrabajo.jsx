import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import ActionIconButton from '../../components/ui/ActionIconButton';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import BrandLogo from '../../components/brand/BrandLogo';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/crud/ConfirmDialog';
import CrudTable from '../../components/crud/CrudTable';
import IncidenciaDetalleModal from '../../components/incidencias/IncidenciaDetalleModal';
import IncidenciasTable from '../../components/incidencias/IncidenciasTable';
import OrdenTrabajoFormModal from '../../components/ordenes/OrdenTrabajoFormModal';
import OrdenProduccionDetalleModal from '../../components/ordenes/OrdenProduccionDetalleModal';
import OrdenProduccionEditModal from '../../components/ordenes/OrdenProduccionEditModal';
import OrdenProduccionFormModal from '../../components/ordenes/OrdenProduccionFormModal';
import OrdenProduccionPrintDocument from '../../components/ordenes/OrdenProduccionPrintDocument';
import * as clientesService from '../../services/clientesService';
import * as materialesService from '../../services/materialesService';
import * as formatosService from '../../services/formatosService';
import * as maquinasService from '../../services/maquinasService';
import * as ordenesProduccionService from '../../services/ordenesProduccionService';
import * as ordenesTrabajoService from '../../services/ordenesTrabajoService';
import * as incidenciasService from '../../services/incidenciasService';
import { formatDateTime, formatLocalDateTime } from '../../utils/datetime';
import { formatOrderCode, formatStatus, getStatusTone } from '../../utils/formatters';
import { hasErrors, isBlank } from '../../utils/validation';

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function usesPlateGames(tipoImpresion) {
  return String(tipoImpresion || '').trim().toUpperCase() === 'T+R';
}

function getEntregaLabel(row) {
  return formatLocalDateTime(row.fecha_entrega_estimada);
}

function getProduccionesSearch(row) {
  const producciones = asArray(row.ordenes_produccion);
  if (producciones.length === 0) return 'Sin producciones';

  return producciones
    .map((produccion) => `${formatOrderCode('OP', produccion.codigo, produccion.id)} ${formatStatus(produccion.estado)}`)
    .join(' ');
}

function ProduccionesList({ row }) {
  const producciones = asArray(row.ordenes_produccion);

  if (producciones.length === 0) {
    return (
      <div className="production-list-cell production-list-empty-cell">
        <small>Sin producciones</small>
      </div>
    );
  }

  return (
    <div className="production-list-cell">
      {producciones.map((produccion) => (
        <div key={produccion.id} className="production-list-item">
          <strong>{formatOrderCode('OP', produccion.codigo, produccion.id)}</strong>
          <Badge tone={getStatusTone(produccion.estado)}>{formatStatus(produccion.estado)}</Badge>
        </div>
      ))}
    </div>
  );
}

function toDateInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function produccionStarted(produccion) {
  const procesoIniciado = asArray(produccion.procesos).some((proceso) => proceso.estado !== 'PENDIENTE');
  return procesoIniciado || !['PENDIENTE', 'ANULADA'].includes(produccion.estado);
}

function canChangeProduccion(produccion) {
  return produccion?.estado === 'PENDIENTE'
    && !asArray(produccion.procesos).some((proceso) => proceso.estado !== 'PENDIENTE')
    && !(
      usesPlateGames(produccion.tipo_impresion)
      && asArray(produccion.juegos_impresion).some((juego) => juego.estado !== 'PENDIENTE')
    );
}

function canChangeOrdenTrabajo(orden) {
  return !['ANULADA', 'ENTREGADA'].includes(orden.estado)
    && !asArray(orden.ordenes_produccion).some(produccionStarted);
}

function OrdenTrabajoEditModal({ orden, onClose, onSubmit }) {
  const [values, setValues] = useState({
    nombre: orden.nombre || '',
    descripcion: orden.descripcion || '',
    fecha_entrega_estimada: toDateInputValue(orden.fecha_entrega_estimada),
    tiene_orden_compra: Boolean(orden.tiene_orden_compra),
    numero_orden_compra: orden.numero_orden_compra || '',
    fecha_orden_compra: toDateInputValue(orden.fecha_orden_compra),
    observacion_orden_compra: orden.observacion_orden_compra || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const setValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    const nextErrors = {};
    if (isBlank(values.nombre)) nextErrors.nombre = 'Ingresa el nombre de la orden.';
    if (isBlank(values.descripcion)) nextErrors.descripcion = 'Ingresa la descripcion de la orden.';
    if (isBlank(values.fecha_entrega_estimada)) nextErrors.fecha_entrega_estimada = 'Ingresa la fecha de entrega estimada.';

    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      nombre: values.nombre.trim(),
      descripcion: values.descripcion.trim() || null,
      fecha_entrega_estimada: values.fecha_entrega_estimada || null,
      tiene_orden_compra: values.tiene_orden_compra,
      numero_orden_compra: values.tiene_orden_compra ? values.numero_orden_compra.trim() || null : null,
      fecha_orden_compra: values.tiene_orden_compra ? values.fecha_orden_compra || null : null,
      observacion_orden_compra: values.tiene_orden_compra ? values.observacion_orden_compra.trim() || null : null,
    };

    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setSubmitError(err.message || 'No se pudo editar la orden de trabajo.');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Editar ${formatOrderCode('OT', orden.codigo, orden.id)}`}
      onClose={onClose}
      panelClassName="modal-panel-picker"
    >
      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <Input
          label="Nombre"
          name="nombre"
          value={values.nombre}
          onChange={(event) => setValue('nombre', event.target.value)}
          error={errors.nombre}
        />
        <label className={`field ${errors.descripcion ? 'field-invalid' : ''}`.trim()}>
          <span className="field-label">Descripcion</span>
          <textarea
            className={`input textarea ${errors.descripcion ? 'input-error' : ''}`.trim()}
            rows={4}
            value={values.descripcion}
            onChange={(event) => setValue('descripcion', event.target.value)}
          />
          {errors.descripcion && <span className="field-error">{errors.descripcion}</span>}
        </label>
        <Input
          label="Entrega estimada"
          name="fecha_entrega_estimada"
          type="date"
          value={values.fecha_entrega_estimada}
          onChange={(event) => setValue('fecha_entrega_estimada', event.target.value)}
          error={errors.fecha_entrega_estimada}
        />

        <fieldset className="checkbox-panel">
          <legend>Orden de compra</legend>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={values.tiene_orden_compra}
              onChange={(event) => setValue('tiene_orden_compra', event.target.checked)}
            />
            Esta orden requiere OC
          </label>
          {values.tiene_orden_compra && (
            <>
              <Input
                label="Numero de OC"
                name="numero_orden_compra"
                value={values.numero_orden_compra}
                onChange={(event) => setValue('numero_orden_compra', event.target.value)}
                placeholder="Pendiente si aun no llega"
              />
              <Input
                label="Fecha de OC"
                name="fecha_orden_compra"
                type="date"
                value={values.fecha_orden_compra}
                onChange={(event) => setValue('fecha_orden_compra', event.target.value)}
              />
              <label className="field">
                <span className="field-label">Observacion OC</span>
                <textarea
                  className="input textarea"
                  rows={3}
                  value={values.observacion_orden_compra}
                  onChange={(event) => setValue('observacion_orden_compra', event.target.value)}
                  placeholder="Opcional"
                />
              </label>
            </>
          )}
        </fieldset>

        {submitError && <div className="alert alert-danger">{submitError}</div>}

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function OrdenCompraModal({ orden, onClose, onSubmit }) {
  const [values, setValues] = useState({
    numero_orden_compra: orden.numero_orden_compra || '',
    fecha_orden_compra: orden.fecha_orden_compra || '',
    observacion_orden_compra: orden.observacion_orden_compra || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const setValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (!values.numero_orden_compra.trim()) {
      setErrors({ numero_orden_compra: 'Ingresa el numero de orden de compra.' });
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        numero_orden_compra: values.numero_orden_compra.trim(),
        fecha_orden_compra: values.fecha_orden_compra || null,
        observacion_orden_compra: values.observacion_orden_compra.trim() || null,
      });
    } catch (err) {
      setSubmitError(err.message || 'No se pudo registrar la orden de compra.');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={orden.numero_orden_compra ? 'Actualizar OC' : 'Registrar OC pendiente'}
      onClose={onClose}
      panelClassName="modal-panel-picker"
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <div className="detail-grid detail-grid-compact">
          <Card className="detail-card">
            <span>Orden de trabajo</span>
            <strong>{formatOrderCode('OT', orden.codigo, orden.id)}</strong>
          </Card>
          <Card className="detail-card">
            <span>Estado</span>
            <Badge tone={getStatusTone(orden.estado)}>{formatStatus(orden.estado)}</Badge>
          </Card>
        </div>

        <Input
          label="Numero de OC"
          name="numero_orden_compra"
          value={values.numero_orden_compra}
          onChange={(event) => setValue('numero_orden_compra', event.target.value)}
          error={errors.numero_orden_compra}
          autoFocus
        />
        <Input
          label="Fecha de OC"
          name="fecha_orden_compra"
          type="date"
          value={values.fecha_orden_compra}
          onChange={(event) => setValue('fecha_orden_compra', event.target.value)}
        />
        <label className="field">
          <span className="field-label">Observacion OC</span>
          <textarea
            className="input textarea"
            rows={3}
            value={values.observacion_orden_compra}
            onChange={(event) => setValue('observacion_orden_compra', event.target.value)}
            placeholder="Opcional"
          />
        </label>

        {submitError && <div className="alert alert-danger">{submitError}</div>}

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar OC'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function OrdenTrabajoPrintDocument({ orden, clienteNombre, producciones, incidencias }) {
  const ocLabel = orden.tiene_orden_compra
    ? orden.numero_orden_compra || 'OC pendiente'
    : 'No requiere OC';

  return (
    <article className="print-document" aria-hidden="true">
      <header className="print-header">
        <div className="print-brand">
          <BrandLogo className="brand-logo-print" />
          <div>
            <h1>MultiBur</h1>
            <p>Orden de trabajo</p>
          </div>
        </div>
        <div className="print-header-code">
          <span>Codigo</span>
          <strong>{formatOrderCode('OT', orden.codigo, orden.id)}</strong>
        </div>
      </header>

      <section className="print-title-block">
        <h2>{orden.nombre || '-'}</h2>
        <p>{orden.descripcion || '-'}</p>
      </section>

      <section className="print-grid">
        <div><span>Cliente</span><strong>{clienteNombre || orden.cliente_id}</strong></div>
        <div><span>Estado</span><strong>{formatStatus(orden.estado)}</strong></div>
        <div><span>Entrega estimada</span><strong>{getEntregaLabel(orden)}</strong></div>
        <div><span>Entrega real</span><strong>{formatDateTime(orden.fecha_entrega_real)}</strong></div>
        <div><span>Orden de compra</span><strong>{ocLabel}</strong></div>
        <div><span>Fecha OC</span><strong>{orden.fecha_orden_compra || '-'}</strong></div>
        <div><span>Guia de entrega</span><strong>{orden.numero_guia_entrega || '-'}</strong></div>
        <div><span>Fecha registro OC</span><strong>{formatDateTime(orden.fecha_registro_orden_compra)}</strong></div>
      </section>

      {orden.observacion_orden_compra && (
        <section className="print-section">
          <h3>Observacion OC</h3>
          <p>{orden.observacion_orden_compra}</p>
        </section>
      )}

      {orden.observacion_entrega && (
        <section className="print-section">
          <h3>Observacion entrega</h3>
          <p>{orden.observacion_entrega}</p>
        </section>
      )}

      <section className="print-section">
        <h3>Ordenes de produccion</h3>
        <table className="print-table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Descripcion</th>
              <th>Entrega</th>
              <th>Cantidad</th>
              <th>Servicio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {producciones.length ? producciones.map((produccion) => (
              <tr key={produccion.id}>
                <td>{formatOrderCode('OP', produccion.codigo, produccion.id)}</td>
                <td>{produccion.descripcion || '-'}</td>
                <td>{formatLocalDateTime(produccion.fecha_entrega_estimada)}</td>
                <td>{produccion.cantidad || '-'}</td>
                <td>{produccion.tipo_servicio || '-'}</td>
                <td>{formatStatus(produccion.estado)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6}>Sin ordenes de produccion.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="print-section">
        <h3>Incidencias</h3>
        <table className="print-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Descripcion</th>
            </tr>
          </thead>
          <tbody>
            {incidencias.length ? incidencias.map((incidencia) => (
              <tr key={incidencia.id}>
                <td>{incidencia.tipo || '-'}</td>
                <td>{incidencia.prioridad || '-'}</td>
                <td>{formatStatus(incidencia.estado)}</td>
                <td>{incidencia.descripcion || '-'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4}>Sin incidencias registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </article>
  );
}

export default function OrdenesTrabajo() {
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [anularTarget, setAnularTarget] = useState(null);
  const [producciones, setProducciones] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [selectedIncidencia, setSelectedIncidencia] = useState(null);
  const [incidenciaHistorial, setIncidenciaHistorial] = useState([]);
  const [incidenciaHistorialLoading, setIncidenciaHistorialLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProduccionForm, setShowProduccionForm] = useState(false);
  const [showOrdenCompraModal, setShowOrdenCompraModal] = useState(false);
  const [selectedProduccion, setSelectedProduccion] = useState(null);
  const [editProduccionTarget, setEditProduccionTarget] = useState(null);
  const [anularProduccionTarget, setAnularProduccionTarget] = useState(null);
  const [duplicarProduccionTarget, setDuplicarProduccionTarget] = useState(null);
  const [produccionDetailLoading, setProduccionDetailLoading] = useState(false);
  const [produccionDetailError, setProduccionDetailError] = useState('');
  const [printProduccionTarget, setPrintProduccionTarget] = useState(null);
  const [printProduccionLoadingId, setPrintProduccionLoadingId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadInitial = async () => {
    setLoading(true);
    setError('');
    try {
      const [ordenesData, clientesData, materialesData, formatosData, maquinasData] = await Promise.all([
        ordenesTrabajoService.listarOrdenesTrabajo(),
        clientesService.listar(),
        materialesService.listar(),
        formatosService.listar(),
        maquinasService.listar(),
      ]);
      setOrdenes(asArray(ordenesData));
      setClientes(asArray(clientesData));
      setMateriales(asArray(materialesData));
      setFormatos(asArray(formatosData));
      setMaquinas(asArray(maquinasData));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las ordenes de trabajo.');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (orden) => {
    setSelected(orden);
    setShowDetailModal(true);
    setDetailLoading(true);
    setError('');
    try {
      const [detail, produccionesData, incidenciasData] = await Promise.all([
        ordenesTrabajoService.obtenerOrdenTrabajo(orden.id),
        ordenesTrabajoService.listarProduccionesPorOrdenTrabajo(orden.id),
        incidenciasService.listarIncidenciasPorOrdenTrabajo(orden.id),
      ]);
      setSelected(detail);
      setProducciones(asArray(produccionesData));
      setIncidencias(asArray(incidenciasData));
    } catch (err) {
      setError(err.message || 'No se pudo cargar el detalle de la orden de trabajo.');
      setProducciones([]);
      setIncidencias([]);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInitial();
  }, []);

  const handleCrearOrden = async (payload) => {
    await ordenesTrabajoService.crearOrdenTrabajo(payload);
    setShowForm(false);
    await loadInitial();
  };

  const handleEditarOrden = async (payload) => {
    if (!editTarget) return;
    setActionLoading(true);
    try {
      const updated = await ordenesTrabajoService.actualizarOrdenTrabajo(editTarget.id, payload);
      setEditTarget(null);
      await loadInitial();
      if (selected?.id === updated.id) {
        await loadDetail(updated);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnularOrden = async () => {
    if (!anularTarget) return;
    setActionLoading(true);
    setActionError('');
    try {
      const updated = await ordenesTrabajoService.anularOrdenTrabajo(anularTarget.id);
      setAnularTarget(null);
      await loadInitial();
      if (selected?.id === updated.id) {
        setShowDetailModal(false);
        setShowOrdenCompraModal(false);
        setSelectedProduccion(null);
        setProduccionDetailError('');
        setPrintProduccionTarget(null);
        setSelected(null);
        setProducciones([]);
        setIncidencias([]);
      }
    } catch (err) {
      setActionError(err.message || 'No se pudo anular la orden de trabajo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnularProduccion = async () => {
    if (!anularProduccionTarget) return;
    setActionLoading(true);
    setActionError('');
    try {
      await ordenesProduccionService.anularOrdenProduccion(anularProduccionTarget.id);
      setAnularProduccionTarget(null);
      setSelectedProduccion(null);
      await loadInitial();
      if (selected) {
        await loadDetail(selected);
      }
    } catch (err) {
      setActionError(err.message || 'No se pudo anular la orden de produccion.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicarProduccion = async () => {
    if (!duplicarProduccionTarget) return;
    const target = duplicarProduccionTarget;
    setActionLoading(true);
    setActionError('');
    try {
      await ordenesProduccionService.duplicarOrdenProduccion(target.id);
      setDuplicarProduccionTarget(null);
      await loadInitial();
      if (selected) {
        await loadDetail(selected);
      }
    } catch (err) {
      setActionError(err.message || 'No se pudo duplicar la orden de produccion.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditarProduccion = async (payload) => {
    if (!editProduccionTarget) return;
    setActionLoading(true);
    try {
      const updated = await ordenesProduccionService.actualizarOrdenProduccion(editProduccionTarget.id, payload);
      setEditProduccionTarget(null);
      await loadInitial();
      if (selected) {
        await loadDetail(selected);
      }
      if (selectedProduccion?.id === updated.id) {
        setSelectedProduccion(updated);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCrearProduccion = async (payload) => {
    if (['ANULADA', 'ENTREGADA'].includes(selected?.estado)) {
      setError('No puedes agregar producciones a una orden de trabajo anulada o entregada.');
      setShowProduccionForm(false);
      return;
    }

    await ordenesTrabajoService.crearProduccionEnOrdenTrabajo(selected.id, {
      ...payload,
      orden_trabajo_id: selected.id,
      cliente_id: selected.cliente_id,
      tipo_origen: 'COMPLETO',
    });
    setShowProduccionForm(false);
    await loadDetail(selected);
  };

  const handleRegistrarOrdenCompra = async (payload) => {
    const updated = await ordenesTrabajoService.registrarOrdenCompra(selected.id, payload);
    setShowOrdenCompraModal(false);
    setSelected(updated);
    await Promise.all([loadInitial(), loadDetail(updated)]);
  };

  useEffect(() => {
    if (!printProduccionTarget) return undefined;

    const previousTitle = document.title;
    const code = formatOrderCode('OP', printProduccionTarget.codigo, printProduccionTarget.id).replace(/[^a-z0-9-]/gi, '_');
    const cleanup = () => {
      document.title = previousTitle;
      setPrintProduccionTarget(null);
      window.removeEventListener('afterprint', cleanup);
    };

    document.title = `OP_${code}`;
    window.addEventListener('afterprint', cleanup);
    const timer = window.setTimeout(() => window.print(), 150);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', cleanup);
    };
  }, [printProduccionTarget]);

  const handlePrintProduccion = async (produccion) => {
    setPrintProduccionLoadingId(produccion.id);
    try {
      const detail = await ordenesProduccionService.obtenerOrdenProduccion(produccion.id);
      setPrintProduccionTarget(detail || produccion);
    } catch (err) {
      setError(err.message || 'No se pudo preparar la impresion de la orden de produccion.');
    } finally {
      setPrintProduccionLoadingId('');
    }
  };

  const loadProduccionDetail = async (produccion) => {
    setSelectedProduccion(produccion);
    setProduccionDetailError('');
    setProduccionDetailLoading(true);
    try {
      const detail = await ordenesProduccionService.obtenerOrdenProduccion(produccion.id);
      setSelectedProduccion(detail || produccion);
    } catch (err) {
      setProduccionDetailError(err.message || 'No se pudo cargar el detalle de la orden de produccion.');
    } finally {
      setProduccionDetailLoading(false);
    }
  };

  const closeProduccionDetail = () => {
    setSelectedProduccion(null);
    setProduccionDetailError('');
  };

  const loadIncidenciaHistorial = async (incidenciaId) => {
    setIncidenciaHistorialLoading(true);
    try {
      const data = await incidenciasService.listarHistorialIncidencia(incidenciaId);
      setIncidenciaHistorial(asArray(data));
    } catch (err) {
      setError(err.message || 'No se pudo cargar el historial de la incidencia.');
      setIncidenciaHistorial([]);
    } finally {
      setIncidenciaHistorialLoading(false);
    }
  };

  const openIncidenciaDetail = async (incidencia) => {
    setSelectedIncidencia(incidencia);
    try {
      const detail = await incidenciasService.obtenerIncidencia(incidencia.id);
      setSelectedIncidencia(detail);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el detalle de la incidencia.');
    }
    await loadIncidenciaHistorial(incidencia.id);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setShowOrdenCompraModal(false);
    setSelectedProduccion(null);
    setDuplicarProduccionTarget(null);
    setProduccionDetailError('');
    setPrintProduccionTarget(null);
    setSelected(null);
    setProducciones([]);
    setIncidencias([]);
  };

  const handlePrintOrdenTrabajo = () => {
    if (!selected) return;
    const previousTitle = document.title;
    document.title = `OT_${formatOrderCode('OT', selected.codigo, selected.id).replace(/[^a-z0-9-]/gi, '_')}`;
    window.print();
    document.title = previousTitle;
  };

  const columns = [
    {
      key: 'codigo',
      label: 'Codigo',
      searchValue: (row) => `${row.codigo || ''} ${row.fecha_entrega_estimada || ''}`,
      render: (row) => (
        <div className="table-cell-stack">
          <strong>{formatOrderCode('OT', row.codigo, row.id)}</strong>
          <small>Entrega: {getEntregaLabel(row)}</small>
        </div>
      ),
    },
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripcion' },
    { key: 'cliente_id', label: 'Cliente', render: (row) => clientes.find((cliente) => cliente.id === row.cliente_id)?.nombre || row.cliente_id },
    {
      key: 'produccion_resumen',
      label: 'Producciones',
      searchValue: getProduccionesSearch,
      render: (row) => <ProduccionesList row={row} />,
    },
    { key: 'estado', label: 'Estado' },
    {
      key: 'acciones',
      label: 'Acciones',
      searchValue: () => '',
      render: (row) => {
        const editable = canChangeOrdenTrabajo(row);
        const disabledTitle = editable ? '' : 'Solo se puede editar una OT si ninguna OP asociada ha iniciado.';

        return (
          <div className="table-actions">
            <ActionIconButton
              icon="view"
              label="Ver orden de trabajo"
              onClick={() => loadDetail(row)}
            />
            <ActionIconButton
              icon="edit"
              label="Editar orden de trabajo"
              onClick={() => setEditTarget(row)}
              disabled={!editable}
              title={disabledTitle}
            />
          </div>
        );
      },
    },
  ];

  const selectedEntregada = selected?.estado === 'ENTREGADA';
  const selectedAnulada = selected?.estado === 'ANULADA';
  const selectedBloqueaProduccion = selectedEntregada || selectedAnulada;
  const selectedEditable = selected ? canChangeOrdenTrabajo(selected) : false;
  const selectedClienteNombre = selected
    ? clientes.find((cliente) => cliente.id === selected.cliente_id)?.nombre
    : '';

  return (
    <div className="page-stack fade-in">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Ordenes de trabajo</h2>
            <p>{ordenes.length} registros cargados</p>
          </div>
          <div className="section-actions">
            <Button
              className="icon-button"
              variant="outline"
              onClick={loadInitial}
              disabled={loading}
              aria-label="Refrescar"
              title="Refrescar"
            >
              ↻
            </Button>
            <Button onClick={() => setShowForm(true)}>+ Nueva orden</Button>
          </div>
        </div>

        {loading ? (
          <p className="muted">Cargando...</p>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <CrudTable columns={columns} rows={ordenes} />
        )}
      </section>

      {showDetailModal && selected && (
        <Modal
          title={`Detalle: ${selected.nombre || selected.codigo || 'Orden de trabajo'}`}
          onClose={closeDetailModal}
          panelClassName="modal-panel-wide"
        >
          <div className="section-heading">
            <div>
              <p>Cliente #{selected.cliente_id} - {producciones.length} ordenes de produccion asociadas</p>
            </div>
            <div className="section-actions">
              <Button
                variant="outline"
                onClick={handlePrintOrdenTrabajo}
                disabled={detailLoading}
              >
                Imprimir / PDF
              </Button>
              <Button
                variant="danger-outline"
                onClick={() => {
                  setActionError('');
                  setAnularTarget(selected);
                }}
                disabled={detailLoading || !selectedEditable}
                title={selectedEditable ? 'Anular orden de trabajo' : 'Solo se puede anular una OT si ninguna OP asociada ha iniciado.'}
              >
                Anular
              </Button>
              <Button
                className="icon-button"
                variant="outline"
                onClick={() => loadDetail(selected)}
                disabled={detailLoading}
                aria-label="Refrescar detalle"
                title="Refrescar detalle"
              >
                ↻
              </Button>
              {!selectedBloqueaProduccion && (
                <Button onClick={() => setShowProduccionForm(true)}>+ Agregar produccion</Button>
              )}
            </div>
          </div>

          {detailLoading ? (
            <p className="muted">Cargando detalle...</p>
          ) : (
            <>
              {selectedEntregada && (
                <div className="alert alert-success">
                  Orden entregada. No se pueden agregar mas ordenes de produccion.
                </div>
              )}
              {selectedAnulada && (
                <div className="alert alert-danger">
                  Orden anulada. No se pueden agregar mas ordenes de produccion.
                </div>
              )}
              {selectedEntregada && selected.tiene_orden_compra && !selected.numero_orden_compra && (
                <div className="alert alert-warning">
                  Esta orden fue entregada y tiene una OC pendiente por registrar.
                </div>
              )}

              <div className="detail-grid">
                <Card className="detail-card">
                  <span>Codigo</span>
                  <strong>{formatOrderCode('OT', selected.codigo, selected.id)}</strong>
                  <small>Entrega estimada: {getEntregaLabel(selected)}</small>
                </Card>
                <Card className="detail-card detail-card-status">
                  <span>Estado</span>
                  <Badge tone={getStatusTone(selected.estado)}>{formatStatus(selected.estado)}</Badge>
                </Card>
                <Card className="detail-card">
                  <span>Orden de compra</span>
                  <div className="detail-card-title-row">
                    <strong>{selected.tiene_orden_compra ? selected.numero_orden_compra || 'OC pendiente' : 'No requiere OC'}</strong>
                    {selected.tiene_orden_compra && (
                      <Badge tone={selected.numero_orden_compra ? 'success' : 'warning'}>
                        {selected.numero_orden_compra ? 'OC registrada' : 'OC pendiente'}
                      </Badge>
                    )}
                  </div>
                  {selected.tiene_orden_compra && selected.fecha_orden_compra && <small>{selected.fecha_orden_compra}</small>}
                  {selected.fecha_registro_orden_compra && (
                    <small>Registrada: {formatDateTime(selected.fecha_registro_orden_compra)}</small>
                  )}
                  {selected.observacion_orden_compra && <small>{selected.observacion_orden_compra}</small>}
                  {selected.tiene_orden_compra && (
                    <Button
                      className="detail-card-action"
                      size="sm"
                      variant={selected.numero_orden_compra ? 'outline' : 'primary'}
                      onClick={() => setShowOrdenCompraModal(true)}
                    >
                      {selected.numero_orden_compra ? 'Actualizar OC' : 'Registrar OC'}
                    </Button>
                  )}
                </Card>
                <Card className="detail-card detail-card-wide"><span>Descripcion</span><strong>{selected.descripcion || '-'}</strong></Card>
              </div>

              <div className="subsection">
                <h3>Ordenes de produccion internas</h3>
                <CrudTable
                  columns={[
                    { key: 'codigo', label: 'Codigo', render: (row) => row.codigo || '-' },
                    { key: 'descripcion', label: 'Descripcion' },
                    { key: 'fecha_entrega_estimada', label: 'Entrega', render: (row) => formatLocalDateTime(row.fecha_entrega_estimada) },
                    { key: 'cantidad', label: 'Cantidad' },
                    { key: 'tipo_servicio', label: 'Servicio' },
                    { key: 'estado', label: 'Estado' },
                    {
                      key: 'acciones',
                      label: 'Acciones',
                      searchValue: () => '',
                      render: (row) => {
                        const editable = canChangeProduccion(row);
                        const disabledTitle = editable ? '' : 'Solo se puede editar una OP pendiente y sin procesos iniciados.';

                        return (
                          <div className="table-actions">
                            <ActionIconButton
                              icon="view"
                              label="Ver orden de produccion"
                              onClick={() => loadProduccionDetail(row)}
                              disabled={produccionDetailLoading && selectedProduccion?.id === row.id}
                            />
                            <ActionIconButton
                              icon="edit"
                              label="Editar orden de produccion"
                              onClick={() => setEditProduccionTarget(row)}
                              disabled={!editable}
                              title={disabledTitle}
                            />
                            <ActionIconButton
                              icon="copy"
                              label="Duplicar orden de produccion"
                              onClick={() => {
                                setActionError('');
                                setDuplicarProduccionTarget(row);
                              }}
                              disabled={!editable}
                              title={editable ? 'Duplicar orden de produccion' : 'Solo se puede duplicar una OP pendiente y sin procesos iniciados.'}
                            />
                          </div>
                        );
                      },
                    },
                  ]}
                  rows={producciones}
                />
              </div>

              <div className="subsection">
                <h3>Incidencias</h3>
                <IncidenciasTable
                  incidencias={incidencias}
                  onView={openIncidenciaDetail}
                />
              </div>
            </>
          )}
        </Modal>
      )}

      {showDetailModal && selected && !detailLoading && !printProduccionTarget && (
        <OrdenTrabajoPrintDocument
          orden={selected}
          clienteNombre={selectedClienteNombre}
          producciones={producciones}
          incidencias={incidencias}
        />
      )}

      {showForm && (
        <OrdenTrabajoFormModal
          clientes={clientes}
          onClose={() => setShowForm(false)}
          onSubmit={handleCrearOrden}
        />
      )}

      {editTarget && (
        <OrdenTrabajoEditModal
          orden={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditarOrden}
        />
      )}

      {anularTarget && (
        <ConfirmDialog
          title="Anular orden de trabajo"
          message={
            actionError
              || `Se anulara ${formatOrderCode('OT', anularTarget.codigo, anularTarget.id)}. Tambien se anularan sus OP pendientes.`
          }
          onCancel={() => {
            setAnularTarget(null);
            setActionError('');
          }}
          onConfirm={handleAnularOrden}
          loading={actionLoading}
        />
      )}

      {showProduccionForm && selected && !selectedBloqueaProduccion && (
        <OrdenProduccionFormModal
          title="Nueva produccion interna"
          clientes={clientes}
          materiales={materiales}
          formatos={formatos}
          maquinas={maquinas}
          defaults={{ cliente_id: selected.cliente_id, orden_trabajo_id: selected.id, tipo_origen: 'COMPLETO' }}
          lockCliente
          onClose={() => setShowProduccionForm(false)}
          onSubmit={handleCrearProduccion}
        />
      )}

      {editProduccionTarget && (
        <OrdenProduccionEditModal
          orden={editProduccionTarget}
          materiales={materiales}
          formatos={formatos}
          maquinas={maquinas}
          onClose={() => setEditProduccionTarget(null)}
          onSubmit={handleEditarProduccion}
        />
      )}

      {showOrdenCompraModal && selected && (
        <OrdenCompraModal
          orden={selected}
          onClose={() => setShowOrdenCompraModal(false)}
          onSubmit={handleRegistrarOrdenCompra}
        />
      )}

      {selectedProduccion && (
        <OrdenProduccionDetalleModal
          produccion={selectedProduccion}
          clientes={clientes}
          materiales={materiales}
          formatos={formatos}
          maquinas={maquinas}
          loading={produccionDetailLoading}
          error={produccionDetailError}
          printLoading={printProduccionLoadingId === selectedProduccion.id}
          onClose={closeProduccionDetail}
          onRefresh={loadProduccionDetail}
          onPrint={handlePrintProduccion}
          canAnular={canChangeProduccion(selectedProduccion)}
          onAnular={(produccion) => {
            setActionError('');
            setAnularProduccionTarget(produccion);
          }}
        />
      )}

      {anularProduccionTarget && (
        <ConfirmDialog
          title="Anular orden de produccion"
          message={
            actionError
              || `Se anulara ${formatOrderCode('OP', anularProduccionTarget.codigo, anularProduccionTarget.id)}. Esta accion conserva el registro, pero lo retira del flujo operativo.`
          }
          onCancel={() => {
            setAnularProduccionTarget(null);
            setActionError('');
          }}
          onConfirm={handleAnularProduccion}
          loading={actionLoading}
        />
      )}

      {duplicarProduccionTarget && (
        <ConfirmDialog
          title="Duplicar orden de produccion"
          message={
            actionError
              || `Se creara una copia de ${formatOrderCode('OP', duplicarProduccionTarget.codigo, duplicarProduccionTarget.id)} dentro de ${formatOrderCode('OT', selected.codigo, selected.id)}. La descripcion recibira el siguiente sufijo disponible, hasta un maximo de 5 copias.`
          }
          onCancel={() => {
            setDuplicarProduccionTarget(null);
            setActionError('');
          }}
          onConfirm={handleDuplicarProduccion}
          loading={actionLoading}
        />
      )}

      {printProduccionTarget && (
        <OrdenProduccionPrintDocument
          produccion={printProduccionTarget}
          clientes={clientes}
          materiales={materiales}
          formatos={formatos}
          maquinas={maquinas}
        />
      )}

      {selectedIncidencia && (
        <IncidenciaDetalleModal
          incidencia={selectedIncidencia}
          historial={incidenciaHistorial}
          historialLoading={incidenciaHistorialLoading}
          onClose={() => {
            setSelectedIncidencia(null);
            setIncidenciaHistorial([]);
          }}
          onRefreshHistorial={() => loadIncidenciaHistorial(selectedIncidencia.id)}
        />
      )}
    </div>
  );
}
