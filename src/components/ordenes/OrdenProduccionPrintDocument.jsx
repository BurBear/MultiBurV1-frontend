import { createPortal } from 'react-dom';
import { formatLocalDateTime } from '../../utils/datetime';
import { formatNumber, formatOrderCode, formatStatus } from '../../utils/formatters';
import BrandLogo from '../brand/BrandLogo';

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function usesPlateGames(tipoImpresion) {
  return String(tipoImpresion || '').trim().toUpperCase() === 'T+R';
}

function findById(items, id) {
  return asArray(items).find((item) => String(item.id) === String(id));
}

function getName(items, id, fallback = '-') {
  const item = findById(items, id);
  return item?.nombre || item?.codigo || fallback;
}

function getFormatoLabel(formatos, id) {
  const formato = findById(formatos, id);
  const alto = Number(formato?.alto);
  const ancho = Number(formato?.ancho);
  if (/^personalizado\b/i.test(String(formato?.nombre || '').trim())
    && Number.isFinite(alto) && alto > 0
    && Number.isFinite(ancho) && ancho > 0) {
    const unidad = String(formato.unidad_medida || 'CM').trim().toLowerCase();
    return `${alto} × ${ancho} ${unidad}`;
  }
  return getName(formatos, id);
}

function getCliente(clientes, id) {
  return findById(clientes, id);
}

function getOrdenTrabajoVinculada(produccion, ordenesTrabajo, ordenTrabajoRelacionada) {
  if (!produccion?.orden_trabajo_id) return null;
  if (ordenTrabajoRelacionada && String(ordenTrabajoRelacionada.id) === String(produccion.orden_trabajo_id)) {
    return ordenTrabajoRelacionada;
  }
  return (
    produccion.orden_trabajo
    || findById(ordenesTrabajo, produccion.orden_trabajo_id)
    || null
  );
}

function getOrdenTrabajoCodigo(produccion, ordenTrabajo) {
  if (!produccion?.orden_trabajo_id) return '-';
  return ordenTrabajo
    ? formatOrderCode('OT', ordenTrabajo.codigo, ordenTrabajo.id)
    : produccion.orden_trabajo_codigo || `OT #${produccion.orden_trabajo_id}`;
}

export default function OrdenProduccionPrintDocument({
  produccion,
  clientes = [],
  materiales = [],
  formatos = [],
  maquinas = [],
  ordenesTrabajo = [],
  ordenTrabajoRelacionada = null,
}) {
  if (!produccion) return null;

  const cliente = getCliente(clientes, produccion.cliente_id);
  const ordenTrabajo = getOrdenTrabajoVinculada(produccion, ordenesTrabajo, ordenTrabajoRelacionada);
  const ordenTrabajoCodigo = getOrdenTrabajoCodigo(produccion, ordenTrabajo);
  const documentoFiscal = String(cliente?.documento || '').trim();
  const usaJuegosPlacas = usesPlateGames(produccion.tipo_impresion);
  const juegosImpresion = usaJuegosPlacas ? asArray(produccion.juegos_impresion) : [];
  const juegosImpresionTexto = juegosImpresion.length
    ? juegosImpresion.map((juego) => juego.codigo_lado).join(' | ')
    : '-';
  const cantidadDemasia = produccion.demasia
    ? `${formatNumber(produccion.cantidad)} + ${formatNumber(produccion.demasia)}`
    : formatNumber(produccion.cantidad);

  const documentContent = (
    <article className="print-document production-print-document" aria-hidden="true">
      <header className="production-print-header">
        <div className="print-brand production-print-brand">
          <BrandLogo className="brand-logo-print" />
          <div>
            <h1>MultiBur - Orden de Produccion</h1>
            <p>Documento operativo para planta y control</p>
          </div>
        </div>
        <div className="production-print-code">
          <strong>Nro {formatOrderCode('OP', produccion.codigo, produccion.id)}</strong>
          <span>Emitido: {formatLocalDateTime(new Date())}</span>
        </div>
      </header>

      <section className="production-print-section">
        <h2>Datos generales</h2>
        <div className="production-print-grid">
          <div>
            <span>Cliente</span>
            <strong>{cliente?.nombre || `Cliente #${produccion.cliente_id}`}</strong>
          </div>
          <div>
            <span>Fecha entrega</span>
            <strong>{formatLocalDateTime(produccion.fecha_entrega_estimada)}</strong>
          </div>
          <div>
            <span>Tipo cliente</span>
            <strong>{cliente?.tipo_cliente || '-'}</strong>
          </div>
          {documentoFiscal && (
            <div>
              <span>Documento fiscal</span>
              <strong>{documentoFiscal}</strong>
            </div>
          )}
          <div>
            <span>Estado</span>
            <strong>{formatStatus(produccion.estado)}</strong>
          </div>
          {produccion.orden_trabajo_id && (
            <div>
              <span>Orden de trabajo</span>
              <strong>{ordenTrabajoCodigo}</strong>
            </div>
          )}
          <div className="production-print-wide">
            <span>Trabajo</span>
            <strong>{produccion.descripcion || '-'}</strong>
          </div>
        </div>
      </section>

      <section className="production-print-section">
        <h2>Ficha tecnica</h2>
        <div className="production-print-grid">
          <div>
            <span>Maquina sugerida</span>
            <strong>{getName(maquinas, produccion.maquina_id, 'Sin maquina')}</strong>
          </div>
          <div>
            <span>Impresion / Color</span>
            <strong>{produccion.tipo_impresion || '-'} / {produccion.modo_color || '-'}</strong>
          </div>
          <div>
            <span>Cantidad + demasia</span>
            <strong>{cantidadDemasia}</strong>
          </div>
          <div>
            <span>Material</span>
            <strong>{getName(materiales, produccion.material_id)}</strong>
          </div>
          {usaJuegosPlacas && (
            <div>
              <span>Juegos de placas</span>
              <strong>{juegosImpresion.length || '-'}</strong>
            </div>
          )}
          <div className="production-print-wide">
            <span>Formato</span>
            <strong>{getFormatoLabel(formatos, produccion.formato_id)}</strong>
          </div>
          {usaJuegosPlacas && (
            <div className="production-print-wide">
              <span>Detalle de placas</span>
              <strong>{juegosImpresionTexto}</strong>
            </div>
          )}
          <div className="production-print-wide">
            <span>Ruta de procesos</span>
            <strong>{asArray(produccion.procesos).map((proceso) => proceso.tipo_proceso).join(' -> ') || '-'}</strong>
          </div>
          <div className="production-print-wide">
            <span>Observacion tecnica</span>
            <strong>{produccion.observaciones || produccion.observacion_tecnica || '-'}</strong>
          </div>
          <div className="production-print-wide">
            <span>Observacion acabados</span>
            <strong>{produccion.observacion_acabados || '-'}</strong>
          </div>
        </div>
      </section>

      {produccion.orden_trabajo_id && (
        <section className="production-print-section">
          <h2>Orden de trabajo vinculada</h2>
          <div className="production-print-grid">
            <div>
              <span>Codigo OT</span>
              <strong>{ordenTrabajoCodigo}</strong>
            </div>
            <div className="production-print-wide">
              <span>Descripcion OT</span>
              <strong>{ordenTrabajo?.descripcion || '-'}</strong>
            </div>
          </div>
        </section>
      )}

      <footer className="production-print-footer">Orden interna MultiBur</footer>
    </article>
  );

  return createPortal(documentContent, document.body);
}
