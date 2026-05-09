import CatalogCrudPage from './CatalogCrudPage';
import * as clientesService from '../../services/clientesService';

const estadoOptions = [
  { value: 'ACTIVO', label: 'ACTIVO' },
  { value: 'INACTIVO', label: 'INACTIVO' },
];

const fields = [
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'documento', label: 'Documento' },
  { name: 'telefono', label: 'Telefono' },
  { name: 'correo', label: 'Correo', type: 'email' },
  { name: 'direccion', label: 'Direccion', type: 'textarea' },
  { name: 'estado', label: 'Estado', type: 'select', options: estadoOptions, defaultValue: 'ACTIVO' },
];

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'documento', label: 'Documento' },
  { key: 'telefono', label: 'Telefono' },
  { key: 'correo', label: 'Correo' },
  { key: 'estado', label: 'Estado' },
];

function validate(values) {
  if (!values.nombre?.trim()) return 'El nombre es obligatorio.';
  if (values.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.correo)) return 'El correo no tiene formato valido.';
  return '';
}

export default function Clientes() {
  return (
    <CatalogCrudPage
      title="Clientes"
      subtitle="Administracion del catalogo de clientes"
      columns={columns}
      fields={fields}
      service={clientesService}
      validate={validate}
    />
  );
}
