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
  if (!values.nombre?.trim()) return 'El nombre es obligatorio.';
  return '';
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
