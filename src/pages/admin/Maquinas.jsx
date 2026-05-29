import CatalogCrudPage from './CatalogCrudPage';
import * as maquinasService from '../../services/maquinasService';

const estadoOptions = [
  { value: 'ACTIVO', label: 'ACTIVO' },
  { value: 'INACTIVO', label: 'INACTIVO' },
];

const fields = [
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'tipo_maquina', label: 'Tipo de maquina' },
  { name: 'descripcion', label: 'Descripcion', type: 'textarea' },
  { name: 'estado', label: 'Estado', type: 'select', options: estadoOptions, defaultValue: 'ACTIVO' },
];

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'tipo_maquina', label: 'Tipo' },
  { key: 'estado', label: 'Estado' },
];

function validate(values) {
  const errors = {};
  if (!values.nombre?.trim()) errors.nombre = 'Ingresa el nombre de la maquina.';
  if (!values.tipo_maquina?.trim()) errors.tipo_maquina = 'Ingresa el tipo de maquina.';
  return errors;
}

export default function Maquinas() {
  return (
    <CatalogCrudPage
      title="Maquinas"
      subtitle="Equipos productivos disponibles"
      columns={columns}
      fields={fields}
      service={maquinasService}
      validate={validate}
    />
  );
}
