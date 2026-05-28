import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import SearchPickerModal from '../ui/SearchPickerModal';
import {
  ACABADOS_ROUTE_OPTIONS,
  BASE_PROCESS_TYPES,
  PLASTIFICADO_MODE_OPTIONS,
  PLASTIFICADO_OPTION,
  isPlastificadoProcess,
  serviceIncludesAcabados,
} from '../../utils/procesos';

function optionLabel(item) {
  return item.nombre || item.codigo || `ID ${item.id}`;
}

function AcabadosRouteModal({ rutaAcabados, onToggle, onMove, onClear, onClose, onPlastificadoModeChange }) {
  const plastificadoValue = rutaAcabados.find((acabado) => isPlastificadoProcess(acabado));
  const plastificadoMode = PLASTIFICADO_MODE_OPTIONS.some((option) => option.value === plastificadoValue)
    ? plastificadoValue
    : PLASTIFICADO_MODE_OPTIONS[0].value;

  return (
    <Modal
      title="Ruta de acabados"
      onClose={onClose}
      panelClassName="modal-panel-wide finish-route-modal"
      headerMeta={<span>{rutaAcabados.length} acabados</span>}
    >
      <div className="finish-route-modal-grid">
        <section className="finish-route-modal-section">
          <h3>Procesos disponibles</h3>
          <p>Marca los acabados que aplican a esta orden de produccion.</p>
          <div className="finish-route-options">
            {ACABADOS_ROUTE_OPTIONS.map((acabado) => {
              const isPlastificado = acabado === PLASTIFICADO_OPTION;
              const checked = isPlastificado
                ? rutaAcabados.some((item) => isPlastificadoProcess(item))
                : rutaAcabados.includes(acabado);

              return (
                <div key={acabado} className={`finish-route-option ${checked ? 'finish-route-option-active' : ''}`}>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(acabado)}
                    />
                    {acabado}
                  </label>
                  {isPlastificado && checked && (
                    <label className="finish-route-plastificado-mode">
                      <span>Modo de plastificado</span>
                      <select
                        className="input"
                        value={plastificadoMode}
                        onChange={(event) => onPlastificadoModeChange(event.target.value)}
                      >
                        {PLASTIFICADO_MODE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="finish-route-modal-section">
          <h3>Secuencia de trabajo</h3>
          <p>El operador de acabados vera cada proceso cuando el anterior este terminado.</p>
          <div className="finish-route-sequence">
            <span>Secuencia definida</span>
            {rutaAcabados.length === 0 ? (
              <p className="muted">Selecciona acabados para definir la ruta.</p>
            ) : (
              rutaAcabados.map((acabado, index) => (
                <div key={acabado} className="finish-route-step">
                  <strong>{index + 1}</strong>
                  <span>{acabado}</span>
                  <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0}>Subir</button>
                  <button type="button" onClick={() => onMove(index, 1)} disabled={index === rutaAcabados.length - 1}>Bajar</button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="form-actions">
        <Button variant="outline" onClick={onClear} disabled={rutaAcabados.length === 0}>
          Restablecer
        </Button>
        <Button onClick={onClose}>
          Usar esta ruta
        </Button>
      </div>
    </Modal>
  );
}

export default function OrdenProduccionFormModal({
  title = 'Nueva orden de produccion',
  clientes = [],
  materiales = [],
  formatos = [],
  maquinas = [],
  defaults = {},
  lockCliente = false,
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState({
    cliente_id: defaults.cliente_id || '',
    orden_trabajo_id: defaults.orden_trabajo_id ?? null,
    tipo_origen: defaults.tipo_origen || 'SERVICIO',
    descripcion: '',
    cantidad: 1,
    fecha_entrega_estimada: '',
    demasia: '',
    material_id: '',
    formato_id: '',
    maquina_id: '',
    modo_color: 'F/C',
    tipo_impresion: '',
    tipo_servicio: 'COMPLETO',
    procesos_personalizados: [],
    ruta_acabados: [],
    estado: 'PENDIENTE',
    observaciones: '',
  });
  const [picker, setPicker] = useState(null);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedCliente = clientes.find((cliente) => cliente.id === Number(values.cliente_id));
  const selectedMaterial = materiales.find((material) => material.id === Number(values.material_id));
  const requiereRutaAcabados = serviceIncludesAcabados(values.tipo_servicio, values.procesos_personalizados);

  const setValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  const toggleProceso = (proceso) => {
    setValues((current) => ({
      ...current,
      procesos_personalizados: current.procesos_personalizados.includes(proceso)
        ? current.procesos_personalizados.filter((item) => item !== proceso)
        : [...current.procesos_personalizados, proceso],
    }));
  };

  const toggleAcabado = (acabado) => {
    setValues((current) => ({
      ...current,
      ruta_acabados: acabado === PLASTIFICADO_OPTION
        ? (
          current.ruta_acabados.some((item) => isPlastificadoProcess(item))
            ? current.ruta_acabados.filter((item) => !isPlastificadoProcess(item))
            : [...current.ruta_acabados, PLASTIFICADO_MODE_OPTIONS[0].value]
        )
        : (
          current.ruta_acabados.includes(acabado)
            ? current.ruta_acabados.filter((item) => item !== acabado)
            : [...current.ruta_acabados, acabado]
        ),
    }));
  };

  const setPlastificadoMode = (value) => {
    setValues((current) => {
      const plastificadoIndex = current.ruta_acabados.findIndex((item) => isPlastificadoProcess(item));
      if (plastificadoIndex === -1) {
        return { ...current, ruta_acabados: [...current.ruta_acabados, value] };
      }
      const ruta = [...current.ruta_acabados];
      ruta[plastificadoIndex] = value;
      return { ...current, ruta_acabados: ruta };
    });
  };

  const moveAcabado = (index, direction) => {
    setValues((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.ruta_acabados.length) return current;
      const ruta = [...current.ruta_acabados];
      [ruta[index], ruta[nextIndex]] = [ruta[nextIndex], ruta[index]];
      return { ...current, ruta_acabados: ruta };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!values.cliente_id) {
      setError('Selecciona un cliente.');
      return;
    }
    if (!values.descripcion.trim()) {
      setError('La descripcion es obligatoria.');
      return;
    }
    if (Number(values.cantidad) <= 0) {
      setError('La cantidad debe ser mayor que cero.');
      return;
    }
    if (!values.fecha_entrega_estimada) {
      setError('La fecha y hora de entrega es obligatoria.');
      return;
    }
    if (values.tipo_servicio === 'PERSONALIZADO' && values.procesos_personalizados.length === 0) {
      setError('Selecciona al menos un proceso personalizado.');
      return;
    }
    if (requiereRutaAcabados && values.ruta_acabados.length === 0) {
      setError('Define al menos un acabado para la ruta de acabados.');
      return;
    }

    const payload = {
      cliente_id: Number(values.cliente_id),
      orden_trabajo_id: values.orden_trabajo_id === '' ? null : values.orden_trabajo_id,
      tipo_origen: values.tipo_origen,
      descripcion: values.descripcion.trim(),
      cantidad: Number(values.cantidad),
      fecha_entrega_estimada: values.fecha_entrega_estimada,
      tipo_servicio: values.tipo_servicio,
      modo_color: values.modo_color || null,
      tipo_impresion: values.tipo_impresion || null,
    };

    if (values.demasia !== '') payload.demasia = Number(values.demasia);
    if (values.material_id) payload.material_id = Number(values.material_id);
    if (values.formato_id) payload.formato_id = Number(values.formato_id);
    if (values.maquina_id) payload.maquina_id = Number(values.maquina_id);
    if (values.observaciones.trim()) payload.observaciones = values.observaciones.trim();
    if (values.tipo_servicio === 'PERSONALIZADO') {
      payload.procesos_personalizados = values.procesos_personalizados;
    }
    if (requiereRutaAcabados) {
      payload.ruta_acabados = values.ruta_acabados;
    }

    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'No se pudo crear la orden de produccion.');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      panelClassName="modal-panel-wide"
      headerMeta={
        <>
          <span>Codigo: Automatico</span>
          <span>Estado: PENDIENTE</span>
        </>
      }
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <div className="order-form-grid">
          <section className="form-section form-section-compact">
            <h3>Datos generales</h3>

            {lockCliente ? (
              <Input className="locked-input" label="Cliente" value={selectedCliente ? optionLabel(selectedCliente) : values.cliente_id} disabled />
            ) : (
              <label className="field">
                <span className="field-label">Cliente</span>
                <button type="button" className="picker-trigger" onClick={() => setPicker('cliente')}>
                  <span>{selectedCliente ? optionLabel(selectedCliente) : 'Click para buscar cliente'}</span>
                  <strong>⌕</strong>
                </button>
              </label>
            )}

            <Input
              label="Trabajo / descripcion"
              name="descripcion"
              value={values.descripcion}
              onChange={(event) => setValue('descripcion', event.target.value)}
              placeholder="Ej: Tarjetas personales"
              required
            />
            <Input
              label="Cantidad"
              name="cantidad"
              type="number"
              min="1"
              value={values.cantidad}
              onChange={(event) => setValue('cantidad', event.target.value)}
              required
            />
            <Input
              label="Fecha y hora de entrega"
              name="fecha_entrega_estimada"
              type="datetime-local"
              value={values.fecha_entrega_estimada}
              onChange={(event) => setValue('fecha_entrega_estimada', event.target.value)}
              required
            />
            <Input
              label="Demasia"
              name="demasia"
              type="number"
              min="0"
              value={values.demasia}
              onChange={(event) => setValue('demasia', event.target.value)}
              placeholder="Ej: 30"
            />
          </section>

          <section className="form-section">
            <h3>Ficha tecnica</h3>

            <label className="field">
              <span className="field-label">Material</span>
              <button type="button" className="picker-trigger" onClick={() => setPicker('material')}>
                <span>{selectedMaterial ? optionLabel(selectedMaterial) : 'Click para buscar material'}</span>
                <strong>⌕</strong>
              </button>
            </label>

            <div className="technical-select-grid">
              <Select label="Formato" name="formato_id" value={values.formato_id} onChange={(event) => setValue('formato_id', event.target.value)}>
                <option value="">Selecciona formato</option>
                {formatos.map((formato) => <option key={formato.id} value={formato.id}>{optionLabel(formato)}</option>)}
              </Select>
              <Select label="Maquina sugerida" name="maquina_id" value={values.maquina_id} onChange={(event) => setValue('maquina_id', event.target.value)}>
                <option value="">Sin maquina</option>
                {maquinas.map((maquina) => <option key={maquina.id} value={maquina.id}>{optionLabel(maquina)}</option>)}
              </Select>
            </div>

            <div className="technical-select-grid">
              <Select label="Modo de color" name="modo_color" value={values.modo_color} onChange={(event) => setValue('modo_color', event.target.value)}>
                <option value="F/C">F/C</option>
                <option value="1 COLOR">1 COLOR</option>
                <option value="PERSONALIZADO">PERSONALIZADO</option>
              </Select>
              <Select label="Tipo de impresion" name="tipo_impresion" value={values.tipo_impresion} onChange={(event) => setValue('tipo_impresion', event.target.value)}>
                <option value="">Selecciona tipo</option>
                <option value="TIRA">TIRA</option>
                <option value="T/R">T/R</option>
                <option value="T+R">T+R</option>
                <option value="DOBLE PINZA">DOBLE PINZA</option>
              </Select>
            </div>

            <Select label="Tipo de servicio" name="tipo_servicio" value={values.tipo_servicio} onChange={(event) => setValue('tipo_servicio', event.target.value)}>
              <option value="COMPLETO">COMPLETO</option>
              <option value="SOLO_IMPRESION">SOLO IMPRESION</option>
              <option value="PERSONALIZADO">PERSONALIZADO</option>
            </Select>

            {values.tipo_servicio === 'PERSONALIZADO' && (
              <fieldset className="checkbox-panel">
                <legend>Ruta de procesos</legend>
                {BASE_PROCESS_TYPES.map((proceso) => (
                  <label key={proceso} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={values.procesos_personalizados.includes(proceso)}
                      onChange={() => toggleProceso(proceso)}
                    />
                    {proceso}
                  </label>
                ))}
              </fieldset>
            )}

            {requiereRutaAcabados && (
              <div className={`finish-route-summary ${values.ruta_acabados.length ? 'finish-route-summary-ready' : ''}`}>
                <div>
                  <span>Ruta de acabados</span>
                  <strong>
                    {values.ruta_acabados.length
                      ? `${values.ruta_acabados.length} acabados configurados`
                      : 'Sin ruta configurada'}
                  </strong>
                </div>
                <p>
                  {values.ruta_acabados.length
                    ? values.ruta_acabados.join(' -> ')
                    : 'Configura los acabados en el orden en que deben ejecutarse.'}
                </p>
                <Button
                  type="button"
                  variant={values.ruta_acabados.length ? 'outline' : 'primary'}
                  onClick={() => setRouteModalOpen(true)}
                >
                  {values.ruta_acabados.length ? 'Editar ruta' : 'Configurar ruta'}
                </Button>
              </div>
            )}

            <label className="field">
              <span className="field-label">Observacion tecnica</span>
              <textarea
                className="input textarea"
                value={values.observaciones}
                onChange={(event) => setValue('observaciones', event.target.value)}
                rows={3}
                placeholder="Indicaciones de impresion"
              />
            </label>
          </section>
        </div>

        {selectedCliente && !lockCliente && (
          <div className="alert alert-success">Cliente seleccionado: {selectedCliente.nombre}</div>
        )}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear orden'}
          </Button>
        </div>
      </form>

      {picker === 'cliente' && (
        <SearchPickerModal
          title="Buscar cliente"
          items={clientes}
          getLabel={(cliente) => cliente.nombre}
          getMeta={(cliente) => cliente.documento}
          placeholder="Nombre o documento"
          onClose={() => setPicker(null)}
          onSelect={(cliente) => {
            setValue('cliente_id', cliente.id);
            setPicker(null);
          }}
        />
      )}

      {picker === 'material' && (
        <SearchPickerModal
          title="Buscar material"
          items={materiales}
          getLabel={(material) => material.nombre}
          getMeta={(material) => material.tipo_material}
          placeholder="Nombre de material"
          onClose={() => setPicker(null)}
          onSelect={(material) => {
            setValue('material_id', material.id);
            setPicker(null);
          }}
        />
      )}

      {routeModalOpen && requiereRutaAcabados && (
        <AcabadosRouteModal
          rutaAcabados={values.ruta_acabados}
          onToggle={toggleAcabado}
          onMove={moveAcabado}
          onClear={() => setValue('ruta_acabados', [])}
          onPlastificadoModeChange={setPlastificadoMode}
          onClose={() => setRouteModalOpen(false)}
        />
      )}
    </Modal>
  );
}
