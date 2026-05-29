import { useMemo, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import {
  hasErrors,
  isBlank,
  isValidEmail,
  normalizeValidationResult,
} from '../../utils/validation';

function getInitialValues(fields, initialData) {
  return fields.reduce((acc, field) => {
    if (initialData && initialData[field.name] !== undefined && initialData[field.name] !== null) {
      acc[field.name] = initialData[field.name];
    } else if (field.defaultValue !== undefined) {
      acc[field.name] = field.defaultValue;
    } else if (field.type === 'checkbox') {
      acc[field.name] = false;
    } else {
      acc[field.name] = '';
    }
    return acc;
  }, {});
}

function normalizeValue(field, value) {
  if (field.type === 'number') return value === '' ? null : Number(value);
  if (field.type === 'checkbox') return Boolean(value);
  return value;
}

export default function CrudFormModal({ title, fields, initialData, onClose, onSubmit, validate }) {
  const initialValues = useMemo(() => getInitialValues(fields, initialData), [fields, initialData]);
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const visibleFields = fields.filter((field) => !field.hidden || !field.hidden(values));

  const handleChange = (field, rawValue) => {
    const value = normalizeValue(field, rawValue);
    setValues((current) => ({ ...current, [field.name]: value }));
    setFieldErrors((current) => ({ ...current, [field.name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    const nextFieldErrors = {};
    visibleFields.forEach((field) => {
      if (field.required && isBlank(values[field.name])) {
        nextFieldErrors[field.name] = `${field.label} es obligatorio.`;
      }
      if (field.type === 'email' && !isBlank(values[field.name]) && !isValidEmail(values[field.name])) {
        nextFieldErrors[field.name] = 'Ingresa un correo valido.';
      }
      if (field.type === 'number' && field.min !== undefined && !isBlank(values[field.name]) && Number(values[field.name]) < Number(field.min)) {
        nextFieldErrors[field.name] = `${field.label} no puede ser menor que ${field.min}.`;
      }
    });

    const customValidation = normalizeValidationResult(validate?.(values));
    Object.assign(nextFieldErrors, customValidation.fieldErrors);

    if (hasErrors(nextFieldErrors) || customValidation.formError) {
      setFieldErrors(nextFieldErrors);
      setError(customValidation.formError);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err.message || 'No se pudo guardar el registro.');
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        {visibleFields.map((field) => {
          if (field.type === 'select') {
            return (
              <Select
                key={field.name}
                label={field.label}
                name={field.name}
                value={values[field.name] ?? ''}
                onChange={(event) => handleChange(field, event.target.value)}
                disabled={field.disabled?.(values)}
                required={field.required}
                error={fieldErrors[field.name]}
              >
                {field.placeholder && <option value="">{field.placeholder}</option>}
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            );
          }

          if (field.type === 'checkbox') {
            return (
              <label key={field.name} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={Boolean(values[field.name])}
                  onChange={(event) => handleChange(field, event.target.checked)}
                />
                {field.label}
              </label>
            );
          }

          if (field.type === 'textarea') {
            const errorId = fieldErrors[field.name] ? `${field.name}-error` : undefined;
            return (
              <label key={field.name} className={`field ${fieldErrors[field.name] ? 'field-invalid' : ''}`.trim()}>
                <span className="field-label">{field.label}</span>
                <textarea
                  className={`input textarea ${fieldErrors[field.name] ? 'input-error' : ''}`.trim()}
                  name={field.name}
                  value={values[field.name] ?? ''}
                  onChange={(event) => handleChange(field, event.target.value)}
                  disabled={field.disabled?.(values)}
                  required={field.required}
                  rows={3}
                  aria-invalid={fieldErrors[field.name] ? 'true' : undefined}
                  aria-describedby={errorId}
                />
                {fieldErrors[field.name] && <span id={errorId} className="field-error">{fieldErrors[field.name]}</span>}
              </label>
            );
          }

          return (
            <Input
              key={field.name}
              label={field.label}
              name={field.name}
              type={field.type || 'text'}
              value={values[field.name] ?? ''}
              onChange={(event) => handleChange(field, event.target.value)}
              disabled={field.disabled?.(values)}
              required={field.required}
              min={field.min}
              error={fieldErrors[field.name]}
            />
          );
        })}

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
