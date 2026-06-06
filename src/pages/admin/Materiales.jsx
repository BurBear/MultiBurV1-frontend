import CatalogCrudPage from './CatalogCrudPage';
import * as materialesService from '../../services/materialesService';

const estadoOptions = [
  { value: 'ACTIVO', label: 'ACTIVO' },
  { value: 'INACTIVO', label: 'INACTIVO' },
];

const fields = [
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'tipo_material', label: 'Tipo de material' },
  { name: 'gramaje', label: 'Gramaje', type: 'number', min: 0 },
  { name: 'unidad_medida', label: 'Unidad de medida', defaultValue: 'UND' },
  { name: 'stock_minimo', label: 'Stock minimo', type: 'number', min: 0, defaultValue: 0 },
  { name: 'estado', label: 'Estado', type: 'select', options: estadoOptions, defaultValue: 'ACTIVO' },
];

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'tipo_material', label: 'Tipo' },
  { key: 'gramaje', label: 'Gramaje' },
  { key: 'unidad_medida', label: 'Unidad' },
  { key: 'stock_minimo', label: 'Stock minimo' },
  { key: 'estado', label: 'Estado' },
];

function validate(values) {
  const errors = {};
  if (!values.nombre?.trim()) errors.nombre = 'Ingresa el nombre del material.';
  if (values.gramaje !== null && values.gramaje !== '' && Number(values.gramaje) < 0) errors.gramaje = 'El gramaje no puede ser negativo.';
  if (!values.unidad_medida?.trim()) errors.unidad_medida = 'Ingresa la unidad de medida.';
  if (Number(values.stock_minimo || 0) < 0) errors.stock_minimo = 'El stock minimo no puede ser negativo.';
  return errors;
}

export default function Materiales() {
  return (
    <CatalogCrudPage
      title="Materiales"
      subtitle="Catalogo de materiales para produccion"
      columns={columns}
      fields={fields}
      service={materialesService}
      validate={validate}
    />
  );
}
