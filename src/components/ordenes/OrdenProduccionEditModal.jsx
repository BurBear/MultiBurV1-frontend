import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import { toPeruDateTimeInputValue } from '../../utils/datetime';
import { formatOrderCode } from '../../utils/formatters';
import { hasErrors, isBlank, validateNonNegativeNumber, validatePositiveNumber } from '../../utils/validation';
import {
  ACABADOS_ROUTE_OPTIONS,
  BASE_PROCESS_TYPES,
  PLASTIFICADO_MODE_OPTIONS,
  PLASTIFICADO_OPTION,
  getProcessArea,
  isPlastificadoProcess,
  serviceIncludesAcabados,
} from '../../utils/procesos';

function optionLabel(item) {
  return item.nombre || item.codigo || `ID ${item.id}`;
}

function asArray(data) {
  return Array.isArray(data) ? data : [];
}

function usesPlateGames(tipoImpresion) {
  return tipoImpresion === 'T+R';
}

function usesPairedPlateGames(tipoImpresion) {
  return tipoImpresion === 'T+R';
}

function defaultPlateGames(tipoImpresion) {
  return usesPlateGames(tipoImpresion) ? 1 : '';
}

function getConfiguredPlateGames(orden) {
  if (!usesPlateGames(orden.tipo_impresion)) {
    return '';
  }

  const juegos = asArray(orden.juegos_impresion);
  if (juegos.length === 0) {
    return defaultPlateGames(orden.tipo_impresion);
  }

  if (usesPairedPlateGames(orden.tipo_impresion)) {
    const groups = new Set(juegos.map((juego) => juego.grupo_par).filter(Boolean));
    return groups.size || defaultPlateGames(orden.tipo_impresion);
  }

  return juegos.length;
}

function buildPlateGamesSummary(tipoImpresion, cantidadJuegos) {
  const total = Number(cantidadJuegos || 0);
  if (!usesPlateGames(tipoImpresion) || !Number.isInteger(total) || total <= 0) return null;

  return {
    title: `${total} ${total === 1 ? 'par configurado' : 'pares configurados'}`,
    detail: `${total * 2} lados: TIRA 1A - RETIRA 1B${total > 1 ? ` hasta TIRA ${total}A - RETIRA ${total}B` : ''}`,
  };
}

function validatePlateGames(nextErrors, values) {
  if (!usesPlateGames(values.tipo_impresion)) return;
  const value = Number(values.cantidad_juegos_placas);
  if (!Number.isInteger(value) || value <= 0) {
    nextErrors.cantidad_juegos_placas = 'Ingresa una cantidad valida de juegos de placas.';
    return;
  }
  if (value > 20) {
    nextErrors.cantidad_juegos_placas = 'El maximo permitido es 20.';
  }
}

function processType(proceso) {
  return proceso?.tipo_proceso || proceso;
}

function getProcesosPersonalizadosFromOrden(orden) {
  if (orden.tipo_servicio !== 'PERSONALIZADO') return [];

  const procesos = [];
  let hasAcabados = false;
  asArray(orden.procesos).forEach((proceso) => {
    const tipo = processType(proceso);
    if (getProcessArea(proceso) === 'ACABADOS') {
      hasAcabados = true;
      return;
    }
    if (tipo && !procesos.includes(tipo)) {
      procesos.push(tipo);
    }
  });

  if (hasAcabados && !procesos.includes('ACABADOS')) {
    procesos.push('ACABADOS');
  }
  return procesos;
}

function getRutaAcabadosFromOrden(orden) {
  return asArray(orden.procesos)
    .filter((proceso) => getProcessArea(proceso) === 'ACABADOS')
    .map(processType)
    .filter(Boolean);
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
    cantidad_juegos_placas: getConfiguredPlateGames(orden),
    tipo_servicio: orden.tipo_servicio || 'COMPLETO',
    procesos_personalizados: getProcesosPersonalizadosFromOrden(orden),
    ruta_acabados: getRutaAcabadosFromOrden(orden),
    observaciones: orden.observaciones || '',
    observacion_acabados: orden.observacion_acabados || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const usaJuegosPlacas = usesPlateGames(values.tipo_impresion);
  const juegosPlacasSummary = buildPlateGamesSummary(values.tipo_impresion, values.cantidad_juegos_placas);
  const requiereRutaAcabados = serviceIncludesAcabados(values.tipo_servicio, values.procesos_personalizados);

  const setValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const setTipoImpresion = (value) => {
    setValues((current) => ({
      ...current,
      tipo_impresion: value,
      cantidad_juegos_placas: usesPlateGames(value)
        ? current.cantidad_juegos_placas || defaultPlateGames(value)
        : '',
    }));
    setErrors((current) => ({ ...current, tipo_impresion: '', cantidad_juegos_placas: '' }));
  };

  const toggleProceso = (proceso) => {
    setValues((current) => ({
      ...current,
      procesos_personalizados: current.procesos_personalizados.includes(proceso)
        ? current.procesos_personalizados.filter((item) => item !== proceso)
        : [...current.procesos_personalizados, proceso],
    }));
    setErrors((current) => ({ ...current, procesos_personalizados: '', ruta_acabados: '' }));
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
    setErrors((current) => ({ ...current, ruta_acabados: '' }));
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
    setErrors((current) => ({ ...current, ruta_acabados: '' }));
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
    validatePlateGames(nextErrors, values);
    if (values.tipo_servicio === 'PERSONALIZADO' && values.procesos_personalizados.length === 0) {
      nextErrors.procesos_personalizados = 'Selecciona al menos un proceso personalizado.';
    }
    if (requiereRutaAcabados && values.ruta_acabados.length === 0) {
      nextErrors.ruta_acabados = 'Define al menos un acabado para la ruta de acabados.';
    }

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
      cantidad_juegos_placas: usaJuegosPlacas ? Number(values.cantidad_juegos_placas) : null,
      tipo_servicio: values.tipo_servicio,
      observaciones: values.observaciones.trim() || null,
      observacion_acabados: values.observacion_acabados.trim() || null,
    };
    if (values.tipo_servicio === 'PERSONALIZADO') {
      payload.procesos_personalizados = values.procesos_personalizados;
    }
    payload.ruta_acabados = requiereRutaAcabados ? values.ruta_acabados : [];

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
                {formatos
                  .filter((formato) => formato.estado === 'ACTIVO' || formato.id === Number(values.formato_id))
                  .map((formato) => (
                    <option key={formato.id} value={formato.id} disabled={formato.estado !== 'ACTIVO'}>
                      {optionLabel(formato)}{formato.estado !== 'ACTIVO' ? ' (Inactivo)' : ''}
                    </option>
                  ))}
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

            <Select label="Tipo de impresion" name="tipo_impresion" value={values.tipo_impresion} onChange={(event) => setTipoImpresion(event.target.value)} error={errors.tipo_impresion}>
              <option value="">Sin tipo</option>
              <option value="TIRA">TIRA</option>
              <option value="T/R">T/R</option>
              <option value="T+R">T+R</option>
              <option value="DOBLE PINZA">DOBLE PINZA</option>
            </Select>

            {usaJuegosPlacas && (
              <div className="plate-games-summary">
                <Input
                  label={usesPairedPlateGames(values.tipo_impresion) ? 'Pares de placas' : 'Juegos de placas'}
                  name="cantidad_juegos_placas"
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  value={values.cantidad_juegos_placas}
                  onChange={(event) => setValue('cantidad_juegos_placas', event.target.value)}
                  error={errors.cantidad_juegos_placas}
                  required
                />
                <div className="plate-games-help">
                  <span>Control por placas</span>
                  <p>
                    Solo aplica para T+R. Define la cantidad de pares que se regeneraran antes de iniciar la OP.
                  </p>
                  {juegosPlacasSummary && (
                    <div className="plate-games-preview">
                      <strong>{juegosPlacasSummary.title}</strong>
                      <small>{juegosPlacasSummary.detail}</small>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Select label="Tipo de servicio" name="tipo_servicio" value={values.tipo_servicio} onChange={(event) => setValue('tipo_servicio', event.target.value)}>
              <option value="COMPLETO">COMPLETO</option>
              <option value="SOLO_IMPRESION">SOLO IMPRESION</option>
              <option value="PERSONALIZADO">PERSONALIZADO</option>
            </Select>

            {values.tipo_servicio === 'PERSONALIZADO' && (
              <fieldset className="checkbox-panel">
                <legend>Ruta de procesos</legend>
                {errors.procesos_personalizados && <span className="field-error">{errors.procesos_personalizados}</span>}
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
                {errors.ruta_acabados && <span className="field-error">{errors.ruta_acabados}</span>}
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

            <label className="field">
              <span className="field-label">Observacion acabados</span>
              <textarea
                className="input textarea"
                value={values.observacion_acabados}
                onChange={(event) => setValue('observacion_acabados', event.target.value)}
                rows={3}
                placeholder="Indicaciones para acabados"
              />
            </label>
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

      {routeModalOpen && requiereRutaAcabados && (
        <AcabadosRouteModal
          rutaAcabados={values.ruta_acabados}
          onToggle={toggleAcabado}
          onMove={moveAcabado}
          onClear={() => setValues((current) => ({ ...current, ruta_acabados: [] }))}
          onPlastificadoModeChange={setPlastificadoMode}
          onClose={() => setRouteModalOpen(false)}
        />
      )}
    </Modal>
  );
}
