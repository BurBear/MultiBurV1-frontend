import { useMemo, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

function generarCodigoOrden() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  return `OT-${stamp}`;
}

function clienteLabel(cliente) {
  return [cliente.nombre, cliente.documento].filter(Boolean).join(' - ');
}

export default function OrdenTrabajoFormModal({ clientes, onClose, onSubmit }) {
  const [values, setValues] = useState({
    cliente_id: '',
    codigo: generarCodigoOrden(),
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
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!values.cliente_id) {
      setError('Selecciona un cliente.');
      return;
    }
    if (!values.nombre.trim()) {
      setError('El nombre de la orden es obligatorio.');
      return;
    }

    const payload = {
      cliente_id: Number(values.cliente_id),
      codigo: values.codigo,
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
      <form className="form-stack" onSubmit={handleSubmit}>
        <div className="order-form-grid">
          <section className="form-section">
            <h3>Cliente</h3>
            <label className="field">
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
            </label>

            <div className="client-picker-list">
              {clientesFiltrados.map((cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  className={`client-picker-item ${Number(values.cliente_id) === cliente.id ? 'client-picker-item-active' : ''}`}
                  onClick={() => setValue('cliente_id', cliente.id)}
                >
                  <strong>{cliente.nombre}</strong>
                  <span>{cliente.documento || 'Sin documento'}</span>
                </button>
              ))}
              {clientesFiltrados.length === 0 && <p className="muted">No se encontraron clientes.</p>}
            </div>
          </section>

          <section className="form-section">
            <h3>Datos de la orden</h3>
            <div className="form-grid">
              <Input className="locked-input" label="Codigo automatico" name="codigo" value={values.codigo} disabled />
              <Input className="locked-input" label="Estado inicial" name="estado" value="PENDIENTE" disabled />
            </div>
            <Input
              label="Nombre"
              name="nombre"
              value={values.nombre}
              onChange={(event) => setValue('nombre', event.target.value)}
              required
            />
            <label className="field">
              <span className="field-label">Descripcion</span>
              <textarea
                className="input textarea"
                value={values.descripcion}
                onChange={(event) => setValue('descripcion', event.target.value)}
                rows={3}
              />
            </label>
            <Input
              label="Fecha entrega estimada"
              name="fecha_entrega_estimada"
              type="date"
              value={values.fecha_entrega_estimada}
              onChange={(event) => setValue('fecha_entrega_estimada', event.target.value)}
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
            Tiene orden de compra
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
          <div className="alert alert-success">
            Cliente seleccionado: {selectedCliente.nombre}
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
