import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Select from '../ui/Select';

const initialFormData = {
  cliente: '',
  descripcion: '',
  cantidad: 1,
  tipo_servicio: 'COMPLETO',
  procesos_personalizados: [],
};

const procesos = ['DISEÑO', 'PLACAS', 'IMPRESION', 'ACABADOS'];

export default function OrdenFormModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleCheckboxChange = (proceso) => {
    const actuales = formData.procesos_personalizados;
    setFormData({
      ...formData,
      procesos_personalizados: actuales.includes(proceso)
        ? actuales.filter((item) => item !== proceso)
        : [...actuales, proceso],
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.cliente.trim() || !formData.descripcion.trim()) {
      setError('Completa cliente y descripcion.');
      return;
    }

    if (Number(formData.cantidad) < 1) {
      setError('La cantidad debe ser mayor a cero.');
      return;
    }

    if (formData.tipo_servicio === 'PERSONALIZADO' && formData.procesos_personalizados.length === 0) {
      setError('Selecciona al menos un proceso personalizado.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        cliente: formData.cliente.trim(),
        descripcion: formData.descripcion.trim(),
        cantidad: parseInt(formData.cantidad, 10),
        tipo_servicio: formData.tipo_servicio,
      };

      if (formData.tipo_servicio === 'PERSONALIZADO') {
        payload.procesos_personalizados = formData.procesos_personalizados;
      }

      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'Error al crear la orden');
      setSaving(false);
    }
  };

  return (
    <Modal title="Crear nueva orden" onClose={onClose}>
      <form className="form-stack" onSubmit={handleSubmit}>
        <Input
          label="Cliente"
          name="cliente"
          value={formData.cliente}
          onChange={handleChange}
          required
          placeholder="Nombre del cliente"
        />
        <Input
          label="Descripcion / producto"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          required
          placeholder="Ej: Revistas 20 pag"
        />
        <Input
          label="Cantidad a producir"
          type="number"
          name="cantidad"
          value={formData.cantidad}
          onChange={handleChange}
          required
          min="1"
        />
        <Select label="Tipo de servicio" name="tipo_servicio" value={formData.tipo_servicio} onChange={handleChange}>
          <option value="COMPLETO">COMPLETO</option>
          <option value="SOLO_IMPRESION">SOLO IMPRESION</option>
          <option value="PERSONALIZADO">PERSONALIZADO</option>
        </Select>

        {formData.tipo_servicio === 'PERSONALIZADO' && (
          <fieldset className="checkbox-panel">
            <legend>Procesos personalizados</legend>
            {procesos.map((proceso) => (
              <label key={proceso} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={formData.procesos_personalizados.includes(proceso)}
                  onChange={() => handleCheckboxChange(proceso)}
                />
                {proceso}
              </label>
            ))}
          </fieldset>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar orden'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
