import { useRef, useState } from 'react';
import CatalogCrudPage from './CatalogCrudPage';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import * as clientesService from '../../services/clientesService';

const estadoOptions = [
  { value: 'ACTIVO', label: 'ACTIVO' },
  { value: 'INACTIVO', label: 'INACTIVO' },
];

const tipoClienteOptions = [
  { value: 'DIRECTO', label: 'DIRECTO' },
  { value: 'SERVICIO', label: 'SERVICIO' },
];

const fields = [
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'documento', label: 'Documento' },
  { name: 'telefono', label: 'Telefono' },
  { name: 'correo', label: 'Correo', type: 'email' },
  { name: 'direccion', label: 'Direccion', type: 'textarea' },
  { name: 'tipo_cliente', label: 'Tipo de cliente', type: 'select', options: tipoClienteOptions, defaultValue: 'DIRECTO', required: true },
  { name: 'requiere_orden_compra', label: 'Trabaja con orden de compra (OC)', type: 'checkbox', defaultValue: false },
  { name: 'estado', label: 'Estado', type: 'select', options: estadoOptions, defaultValue: 'ACTIVO' },
];

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'documento', label: 'Documento' },
  { key: 'telefono', label: 'Telefono' },
  { key: 'correo', label: 'Correo' },
  {
    key: 'tipo_cliente',
    label: 'Tipo',
    render: (row) => {
      const tipo = row.tipo_cliente === 'SERVICIO' ? 'SERVICIO' : 'DIRECTO';
      return <Badge tone={tipo === 'SERVICIO' ? 'info' : 'success'}>{tipo}</Badge>;
    },
    searchValue: (row) => row.tipo_cliente || 'DIRECTO',
  },
  {
    key: 'requiere_orden_compra',
    label: 'OC',
    render: (row) => (
      <Badge tone={row.requiere_orden_compra ? 'warning' : 'neutral'}>
        {row.requiere_orden_compra ? 'REQUIERE OC' : 'SIN OC'}
      </Badge>
    ),
  },
  { key: 'estado', label: 'Estado' },
];

function validate(values) {
  const errors = {};
  if (!values.nombre?.trim()) errors.nombre = 'Ingresa el nombre del cliente.';
  if (values.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.correo)) errors.correo = 'Ingresa un correo valido.';
  return errors;
}

export default function Clientes() {
  const fileInputRef = useRef(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const downloadBlob = (blob) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clientes.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (setError) => {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const blob = await clientesService.exportarCsv();
      downloadBlob(blob);
      setNotice('Archivo de clientes exportado para Excel.');
    } catch (err) {
      setError(err.message || 'No se pudo exportar clientes.');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (event, reload, setError) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setNotice('');
    setError('');
    try {
      const result = await clientesService.importarCsv(file);
      setNotice(`Importacion completada: ${result.creados} creados, ${result.actualizados} actualizados, ${result.omitidos} omitidos.`);
      await reload();
    } catch (err) {
      setError(err.message || 'No se pudo importar clientes.');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  };

  return (
    <CatalogCrudPage
      title="Clientes"
      subtitle="Administracion del catalogo de clientes"
      columns={columns}
      fields={fields}
      service={clientesService}
      validate={validate}
      notice={notice}
      extraActions={({ reload, loading, setError }) => (
        <>
          <Button
            variant="outline"
            onClick={() => handleExport(setError)}
            disabled={loading || busy}
          >
            Exportar Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || busy}
          >
            Importar Excel
          </Button>
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => handleImport(event, reload, setError)}
          />
        </>
      )}
    />
  );
}
