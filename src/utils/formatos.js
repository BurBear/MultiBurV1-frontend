export const FORMATO_PERSONALIZADO = 'PERSONALIZADO';

export function buscarFormatoPorMedidas(formatos, alto, ancho) {
  return formatos.find((formato) => (
    formato.estado === 'ACTIVO'
    && String(formato.unidad_medida).trim().toUpperCase() === 'CM'
    && Number(formato.alto) === Number(alto)
    && Number(formato.ancho) === Number(ancho)
  ));
}

export function validarFormatoPersonalizado(errors, values) {
  if (values.formato_id !== FORMATO_PERSONALIZADO) return;

  for (const campo of ['alto', 'ancho']) {
    const valor = Number(values[campo]);
    if (!Number.isFinite(valor) || valor <= 0) {
      errors[campo] = `El ${campo} debe ser mayor que cero.`;
    }
  }
}
