import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Select from '../ui/Select';

const procesos = ['DISEÑO', 'PLACAS', 'IMPRESION', 'ACABADOS'];

function optionLabel(item) {
  return item.nombre || item.codigo || `ID ${item.id}`;
}

export default function OrdenProduccionFormModal({
  title = 'Nueva orden de produccion',
  clientes = [],
  materiales = [],
  formatos = [],
  maquinas = [],
  defaults = {},
  lockCliente = false,
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState({
    cliente_id: defaults.cliente_id || '',
    orden_trabajo_id: defaults.orden_trabajo_id ?? null,
    tipo_origen: defaults.tipo_origen || 'SERVICIO',
    descripcion: '',
    cantidad: 1,
    material_id: '',
    formato_id: '',
    maquina_id: '',
    tipo_servicio: 'COMPLETO',
    procesos_personalizados: [],
    estado: 'PENDIENTE',
    observaciones: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const setValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  const toggleProceso = (proceso) => {
    setValues((current) => ({
      ...current,
      procesos_personalizados: current.procesos_personalizados.includes(proceso)
        ? current.procesos_personalizados.filter((item) => item !== proceso)
        : [...current.procesos_personalizados, proceso],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!values.cliente_id) {
      setError('Selecciona un cliente.');
      return;
    }
    if (!values.descripcion.trim()) {
      setError('La descripcion es obligatoria.');
      return;
    }
    if (Number(values.cantidad) <= 0) {
      setError('La cantidad debe ser mayor que cero.');
      return;
    }
    if (values.tipo_servicio === 'PERSONALIZADO' && values.procesos_personalizados.length === 0) {
      setError('Selecciona al menos un proceso personalizado.');
      return;
    }

    const payload = {
      cliente_id: Number(values.cliente_id),
      orden_trabajo_id: values.orden_trabajo_id === '' ? null : values.orden_trabajo_id,
      tipo_origen: values.tipo_origen,
      descripcion: values.descripcion.trim(),
      cantidad: Number(values.cantidad),
      tipo_servicio: values.tipo_servicio,
      estado: values.estado,
    };

    if (values.material_id) payload.material_id = Number(values.material_id);
    if (values.formato_id) payload.formato_id = Number(values.formato_id);
    if (values.maquina_id) payload.maquina_id = Number(values.maquina_id);
    if (values.observaciones.trim()) payload.observaciones = values.observaciones.trim();
    if (values.tipo_servicio === 'PERSONALIZADO') {
      payload.procesos_personalizados = values.procesos_personalizados;
    }

    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'No se pudo crear la orden de produccion.');
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form className="form-stack" onSubmit={handleSubmit}>
        <Select
          label="Cliente"
          name="cliente_id"
          value={values.cliente_id}
          onChange={(event) => setValue('cliente_id', event.target.value)}
          disabled={lockCliente}
          required
        >
          <option value="">Selecciona cliente</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {optionLabel(cliente)}
            </option>
          ))}
        </Select>

        <Input
          label="Descripcion"
          name="descripcion"
          value={values.descripcion}
          onChange={(event) => setValue('descripcion', event.target.value)}
          required
        />
        <Input
          label="Cantidad"
          name="cantidad"
          type="number"
          min="1"
          value={values.cantidad}
          onChange={(event) => setValue('cantidad', event.target.value)}
          required
        />

        <div className="form-grid">
          <Select label="Material" name="material_id" value={values.material_id} onChange={(event) => setValue('material_id', event.target.value)}>
            <option value="">Sin material</option>
            {materiales.map((material) => <option key={material.id} value={material.id}>{optionLabel(material)}</option>)}
          </Select>
          <Select label="Formato" name="formato_id" value={values.formato_id} onChange={(event) => setValue('formato_id', event.target.value)}>
            <option value="">Sin formato</option>
            {formatos.map((formato) => <option key={formato.id} value={formato.id}>{optionLabel(formato)}</option>)}
          </Select>
          <Select label="Maquina" name="maquina_id" value={values.maquina_id} onChange={(event) => setValue('maquina_id', event.target.value)}>
            <option value="">Sin maquina</option>
            {maquinas.map((maquina) => <option key={maquina.id} value={maquina.id}>{optionLabel(maquina)}</option>)}
          </Select>
        </div>

        <Select label="Tipo de servicio" name="tipo_servicio" value={values.tipo_servicio} onChange={(event) => setValue('tipo_servicio', event.target.value)}>
          <option value="COMPLETO">COMPLETO</option>
          <option value="SOLO_IMPRESION">SOLO IMPRESION</option>
          <option value="PERSONALIZADO">PERSONALIZADO</option>
        </Select>

        {values.tipo_servicio === 'PERSONALIZADO' && (
          <fieldset className="checkbox-panel">
            <legend>Procesos personalizados</legend>
            {procesos.map((proceso) => (
              <label key={proceso} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={values.procesos_personalizados.includes(proceso)}
                  onChange={() => toggleProceso(proceso)}
                />
                {proceso}
              </label>
            ))}
          </fieldset>
        )}

        <label className="field">
          <span className="field-label">Observaciones</span>
          <textarea
            className="input textarea"
            value={values.observaciones}
            onChange={(event) => setValue('observaciones', event.target.value)}
            rows={3}
          />
        </label>

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
