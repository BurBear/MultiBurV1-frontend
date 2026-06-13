import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import { toPeruDateTimeInputValue } from '../../utils/datetime';
import { formatOrderCode } from '../../utils/formatters';
import { hasErrors, isBlank, validateNonNegativeNumber, validatePositiveNumber } from '../../utils/validation';

function optionLabel(item) {
  return item.nombre || item.codigo || `ID ${item.id}`;
}

export default function OrdenProduccionEditModal({
  orden,
  materiales,
  formatos,
  maquinas,
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState({
    descripcion: orden.descripcion || '',
    cantidad: orden.cantidad || '',
    fecha_entrega_estimada: toPeruDateTimeInputValue(orden.fecha_entrega_estimada),
    demasia: orden.demasia ?? '',
    material_id: orden.material_id || '',
    formato_id: orden.formato_id || '',
    maquina_id: orden.maquina_id || '',
    modo_color: orden.modo_color || 'F/C',
    tipo_impresion: orden.tipo_impresion || '',
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
    if (isBlank(values.descripcion)) nextErrors.descripcion = 'Ingresa la descripcion.';
    validatePositiveNumber(nextErrors, values, 'cantidad', 'La cantidad debe ser mayor que cero.');
    if (isBlank(values.fecha_entrega_estimada)) nextErrors.fecha_entrega_estimada = 'Ingresa fecha y hora de entrega.';
    validateNonNegativeNumber(nextErrors, values, 'demasia', 'La demasia no puede ser negativa.');
    if (!values.material_id) nextErrors.material_id = 'Selecciona un material.';
    if (!values.formato_id) nextErrors.formato_id = 'Selecciona un formato.';
    if (!values.maquina_id) nextErrors.maquina_id = 'Selecciona una maquina sugerida.';
    if (!values.tipo_impresion) nextErrors.tipo_impresion = 'Selecciona el tipo de impresion.';

    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      descripcion: values.descripcion.trim(),
      cantidad: Number(values.cantidad),
      fecha_entrega_estimada: values.fecha_entrega_estimada,
      demasia: values.demasia === '' ? null : Number(values.demasia),
      material_id: values.material_id ? Number(values.material_id) : null,
      formato_id: values.formato_id ? Number(values.formato_id) : null,
      maquina_id: values.maquina_id ? Number(values.maquina_id) : null,
      modo_color: values.modo_color || null,
      tipo_impresion: values.tipo_impresion || null,
    };

    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setSubmitError(err.message || 'No se pudo editar la orden de produccion.');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Editar ${formatOrderCode('OP', orden.codigo, orden.id)}`}
      onClose={onClose}
      panelClassName="modal-panel-wide"
    >
      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <div className="order-form-grid">
          <section className="form-section form-section-compact">
            <h3>Datos generales</h3>
            <Input
              label="Trabajo / descripcion"
              name="descripcion"
              value={values.descripcion}
              onChange={(event) => setValue('descripcion', event.target.value)}
              error={errors.descripcion}
            />
            <Input
              label="Cantidad"
              name="cantidad"
              type="number"
              min="1"
              value={values.cantidad}
              onChange={(event) => setValue('cantidad', event.target.value)}
              error={errors.cantidad}
            />
            <Input
              label="Fecha y hora de entrega"
              name="fecha_entrega_estimada"
              type="datetime-local"
              value={values.fecha_entrega_estimada}
              onChange={(event) => setValue('fecha_entrega_estimada', event.target.value)}
              error={errors.fecha_entrega_estimada}
            />
            <Input
              label="Demasia"
              name="demasia"
              type="number"
              min="0"
              value={values.demasia}
              onChange={(event) => setValue('demasia', event.target.value)}
              error={errors.demasia}
            />
          </section>

          <section className="form-section">
            <h3>Ficha tecnica</h3>
            <div className="technical-select-grid">
              <Select label="Material" name="material_id" value={values.material_id} onChange={(event) => setValue('material_id', event.target.value)} error={errors.material_id}>
                <option value="">Sin material</option>
                {materiales.map((material) => <option key={material.id} value={material.id}>{optionLabel(material)}</option>)}
              </Select>
              <Select label="Formato" name="formato_id" value={values.formato_id} onChange={(event) => setValue('formato_id', event.target.value)} error={errors.formato_id}>
                <option value="">Sin formato</option>
                {formatos.map((formato) => <option key={formato.id} value={formato.id}>{optionLabel(formato)}</option>)}
              </Select>
            </div>

            <div className="technical-select-grid">
              <Select label="Maquina sugerida" name="maquina_id" value={values.maquina_id} onChange={(event) => setValue('maquina_id', event.target.value)} error={errors.maquina_id}>
                <option value="">Sin maquina</option>
                {maquinas.map((maquina) => <option key={maquina.id} value={maquina.id}>{optionLabel(maquina)}</option>)}
              </Select>
              <Select label="Modo de color" name="modo_color" value={values.modo_color} onChange={(event) => setValue('modo_color', event.target.value)}>
                <option value="F/C">F/C</option>
                <option value="1 COLOR">1 COLOR</option>
                <option value="PERSONALIZADO">PERSONALIZADO</option>
              </Select>
            </div>

            <Select label="Tipo de impresion" name="tipo_impresion" value={values.tipo_impresion} onChange={(event) => setValue('tipo_impresion', event.target.value)} error={errors.tipo_impresion}>
              <option value="">Sin tipo</option>
              <option value="TIRA">TIRA</option>
              <option value="T/R">T/R</option>
              <option value="T+R">T+R</option>
              <option value="DOBLE PINZA">DOBLE PINZA</option>
            </Select>
          </section>
        </div>

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
