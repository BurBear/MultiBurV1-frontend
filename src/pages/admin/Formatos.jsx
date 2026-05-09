import CatalogCrudPage from './CatalogCrudPage';
import * as formatosService from '../../services/formatosService';

const estadoOptions = [
  { value: 'ACTIVO', label: 'ACTIVO' },
  { value: 'INACTIVO', label: 'INACTIVO' },
];

const fields = [
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'ancho', label: 'Ancho', type: 'number', min: 0 },
  { name: 'alto', label: 'Alto', type: 'number', min: 0 },
  { name: 'unidad_medida', label: 'Unidad de medida', defaultValue: 'CM' },
  { name: 'descripcion', label: 'Descripcion', type: 'textarea' },
  { name: 'estado', label: 'Estado', type: 'select', options: estadoOptions, defaultValue: 'ACTIVO' },
];

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'ancho', label: 'Ancho' },
  { key: 'alto', label: 'Alto' },
  { key: 'unidad_medida', label: 'Unidad' },
  { key: 'estado', label: 'Estado' },
];

function validate(values) {
  if (!values.nombre?.trim()) return 'El nombre es obligatorio.';
  if (Number(values.ancho) <= 0) return 'El ancho debe ser mayor que cero.';
  if (Number(values.alto) <= 0) return 'El alto debe ser mayor que cero.';
  return '';
}

export default function Formatos() {
  return (
    <CatalogCrudPage
      title="Formatos"
      subtitle="Formatos de impresion y medidas disponibles"
      columns={columns}
      fields={fields}
      service={formatosService}
      validate={validate}
    />
  );
}
