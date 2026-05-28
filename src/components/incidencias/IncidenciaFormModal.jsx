import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import { formatOrderCode } from '../../utils/formatters';
import {
  INCIDENCIA_PRIORIDADES,
  INCIDENCIA_TIPOS,
  formatIncidenciaValue,
} from '../../utils/incidencias';

function ordenLabel(orden) {
  return [formatOrderCode('OT', orden.codigo, orden.id), orden.nombre || orden.descripcion].filter(Boolean).join(' - ');
}

export default function IncidenciaFormModal({
  title = 'Registrar incidencia',
  ordenesTrabajo = [],
  defaults = {},
  lockedContext = false,
  contextLabel = 'Contexto',
  contextValue = '',
  contextMeta = '',
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState({
    orden_id: defaults.orden_id || defaults.orden_trabajo_id || '',
    orden_produccion_id: defaults.orden_produccion_id || '',
    proceso_id: defaults.proceso_id || '',
    tipo: defaults.tipo || 'OTRO',
    descripcion: defaults.descripcion || '',
    prioridad: defaults.prioridad || 'MEDIA',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const setValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!values.orden_id && !values.orden_produccion_id) {
      setError('No hay una orden asociada para registrar la incidencia.');
      return;
    }
    if (!values.proceso_id) {
      setError('Ingresa el proceso asociado.');
      return;
    }
    if (!values.descripcion.trim()) {
      setError('La descripcion de la incidencia es obligatoria.');
      return;
    }

    const payload = {
      proceso_id: Number(values.proceso_id),
      tipo: values.tipo,
      descripcion: values.descripcion.trim(),
      prioridad: values.prioridad,
    };

    if (values.orden_produccion_id) {
      payload.orden_produccion_id = Number(values.orden_produccion_id);
    } else {
      payload.orden_id = Number(values.orden_id);
    }

    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'No se pudo registrar la incidencia.');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      panelClassName="modal-panel-wide"
      headerMeta={lockedContext ? <span>Contexto de proceso seleccionado</span> : null}
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <div className="form-grid">
          {lockedContext ? (
            <div className="locked-context">
              <span>{contextLabel}</span>
              <strong>{contextValue || `Proceso #${values.proceso_id}`}</strong>
              {contextMeta && <small>{contextMeta}</small>}
            </div>
          ) : ordenesTrabajo.length > 0 ? (
            <Select
              label="Orden de trabajo"
              name="orden_id"
              value={values.orden_id}
              onChange={(event) => setValue('orden_id', event.target.value)}
              required
            >
              <option value="">Selecciona orden</option>
              {ordenesTrabajo.map((orden) => (
                <option key={orden.id} value={orden.id}>{ordenLabel(orden)}</option>
              ))}
            </Select>
          ) : (
            <Input
              className={lockedContext ? 'locked-input' : ''}
              label="Orden de trabajo"
              name="orden_id"
              type="number"
              min="1"
              value={values.orden_id}
              onChange={(event) => setValue('orden_id', event.target.value)}
              disabled={lockedContext}
              required
            />
          )}

          {!lockedContext && (
            <Input
              label="Proceso"
              name="proceso_id"
              type="number"
              min="1"
              value={values.proceso_id}
              onChange={(event) => setValue('proceso_id', event.target.value)}
              required
            />
          )}

          <Select label="Tipo" name="tipo" value={values.tipo} onChange={(event) => setValue('tipo', event.target.value)}>
            {INCIDENCIA_TIPOS.map((tipo) => (
              <option key={tipo} value={tipo}>{formatIncidenciaValue(tipo)}</option>
            ))}
          </Select>

          <Select
            label="Prioridad"
            name="prioridad"
            value={values.prioridad}
            onChange={(event) => setValue('prioridad', event.target.value)}
          >
            {INCIDENCIA_PRIORIDADES.map((prioridad) => (
              <option key={prioridad} value={prioridad}>{formatIncidenciaValue(prioridad)}</option>
            ))}
          </Select>
        </div>

        <label className="field">
          <span className="field-label">Descripcion</span>
          <textarea
            className="input textarea"
            value={values.descripcion}
            onChange={(event) => setValue('descripcion', event.target.value)}
            rows={4}
            required
          />
        </label>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Registrar incidencia'}</Button>
        </div>
      </form>
    </Modal>
  );
}
