import { useMemo, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { hasErrors, isBlank } from '../../utils/validation';

function clienteLabel(cliente) {
  return [cliente.nombre, cliente.documento].filter(Boolean).join(' - ');
}

export default function OrdenTrabajoFormModal({ clientes, onClose, onSubmit }) {
  const [values, setValues] = useState({
    cliente_id: '',
    nombre: '',
    descripcion: '',
    tiene_orden_compra: false,
    numero_orden_compra: '',
    fecha_orden_compra: '',
    fecha_entrega_estimada: '',
    estado: 'PENDIENTE',
  });
  const [clienteSearch, setClienteSearch] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const clientesFiltrados = useMemo(() => {
    const search = clienteSearch.trim().toLowerCase();
    if (!search) return clientes.slice(0, 6);
    return clientes
      .filter((cliente) => clienteLabel(cliente).toLowerCase().includes(search))
      .slice(0, 8);
  }, [clientes, clienteSearch]);

  const selectedCliente = clientes.find((cliente) => cliente.id === Number(values.cliente_id));

  const setValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const selectCliente = (cliente) => {
    setValues((current) => ({
      ...current,
      cliente_id: cliente.id,
      tiene_orden_compra: Boolean(cliente.requiere_orden_compra),
      numero_orden_compra: cliente.requiere_orden_compra ? current.numero_orden_compra : '',
      fecha_orden_compra: cliente.requiere_orden_compra ? current.fecha_orden_compra : '',
    }));
    setErrors((current) => ({ ...current, cliente_id: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setErrors({});

    const nextErrors = {};
    if (!values.cliente_id) nextErrors.cliente_id = 'Selecciona un cliente.';
    if (isBlank(values.nombre)) nextErrors.nombre = 'Ingresa el nombre de la orden.';
    if (isBlank(values.descripcion)) nextErrors.descripcion = 'Ingresa la descripcion de la orden.';
    if (isBlank(values.fecha_entrega_estimada)) nextErrors.fecha_entrega_estimada = 'Ingresa la fecha de entrega estimada.';

    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      cliente_id: Number(values.cliente_id),
      nombre: values.nombre.trim(),
      descripcion: values.descripcion.trim() || null,
      tiene_orden_compra: values.tiene_orden_compra,
      numero_orden_compra: values.tiene_orden_compra ? values.numero_orden_compra.trim() || null : null,
      fecha_orden_compra: values.tiene_orden_compra ? values.fecha_orden_compra || null : null,
      fecha_entrega_estimada: values.fecha_entrega_estimada || null,
      estado: 'PENDIENTE',
    };

    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'No se pudo crear la orden de trabajo.');
      setSaving(false);
    }
  };

  return (
    <Modal title="Nueva orden de trabajo" onClose={onClose} panelClassName="modal-panel-wide">
      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <div className="order-form-grid">
          <section className="form-section">
            <h3>Cliente</h3>
            <label className={`field ${errors.cliente_id ? 'field-invalid' : ''}`.trim()}>
              <span className="field-label">Buscar cliente</span>
              <div className="search-input-wrap">
                <span aria-hidden="true">⌕</span>
                <input
                  className="input"
                  type="search"
                  value={clienteSearch}
                  onChange={(event) => setClienteSearch(event.target.value)}
                  placeholder="Nombre o documento"
                />
              </div>
              {errors.cliente_id && <span className="field-error">{errors.cliente_id}</span>}
            </label>

            <div className="client-picker-list">
              {clientesFiltrados.map((cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  className={`client-picker-item ${Number(values.cliente_id) === cliente.id ? 'client-picker-item-active' : ''}`}
                  onClick={() => selectCliente(cliente)}
                >
                  <strong>{cliente.nombre}</strong>
                  <span>{cliente.documento || 'Sin documento'}</span>
                  {cliente.requiere_orden_compra && <small>Trabaja con OC</small>}
                </button>
              ))}
              {clientesFiltrados.length === 0 && <p className="muted">No se encontraron clientes.</p>}
            </div>
          </section>

          <section className="form-section">
            <h3>Datos de la orden</h3>
            <div className="form-grid">
              <Input className="locked-input" label="Codigo automatico" name="codigo" value="Automatico" disabled />
              <Input className="locked-input" label="Estado inicial" name="estado" value="PENDIENTE" disabled />
            </div>
            <Input
              label="Nombre"
              name="nombre"
              value={values.nombre}
              onChange={(event) => setValue('nombre', event.target.value)}
              error={errors.nombre}
              required
            />
            <label className={`field ${errors.descripcion ? 'field-invalid' : ''}`.trim()}>
              <span className="field-label">Descripcion</span>
              <textarea
                className={`input textarea ${errors.descripcion ? 'input-error' : ''}`.trim()}
                value={values.descripcion}
                onChange={(event) => setValue('descripcion', event.target.value)}
                rows={3}
              />
              {errors.descripcion && <span className="field-error">{errors.descripcion}</span>}
            </label>
            <Input
              label="Fecha entrega estimada"
              name="fecha_entrega_estimada"
              type="date"
              value={values.fecha_entrega_estimada}
              onChange={(event) => setValue('fecha_entrega_estimada', event.target.value)}
              error={errors.fecha_entrega_estimada}
              required
            />
          </section>
        </div>

        <section className="form-section">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={values.tiene_orden_compra}
              onChange={(event) => setValue('tiene_orden_compra', event.target.checked)}
            />
            Esta orden requiere OC
          </label>

          {values.tiene_orden_compra && (
            <div className="form-grid">
              <Input
                label="Numero orden de compra"
                name="numero_orden_compra"
                value={values.numero_orden_compra}
                onChange={(event) => setValue('numero_orden_compra', event.target.value)}
              />
              <Input
                label="Fecha orden de compra"
                name="fecha_orden_compra"
                type="date"
                value={values.fecha_orden_compra}
                onChange={(event) => setValue('fecha_orden_compra', event.target.value)}
              />
            </div>
          )}
        </section>

        {selectedCliente && (
          <div className={selectedCliente.requiere_orden_compra ? 'alert alert-warning' : 'alert alert-success'}>
            Cliente seleccionado: {selectedCliente.nombre}. {selectedCliente.requiere_orden_compra
              ? 'Este cliente trabaja con OC; el numero puede quedar pendiente si aun no lo tienes.'
              : 'Este cliente no requiere OC por defecto.'}
          </div>
        )}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear orden'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
