import { formatLocalDateTime } from '../../utils/datetime';
import { formatNumber, formatOrderCode, formatStatus } from '../../utils/formatters';
import { getProcessArea } from '../../utils/procesos';
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

function getCliente(clientes, id) {
  return findById(clientes, id);
}

function getAcabados(produccion) {
  return asArray(produccion.procesos)
    .filter((proceso) => getProcessArea(proceso) === 'ACABADOS')
    .map((proceso) => proceso.tipo_proceso);
}

function getProcesoActual(produccion) {
  const procesos = asArray(produccion.procesos);
  return (
    procesos.find((proceso) => proceso.estado === 'EN_PROCESO')
    || procesos.find((proceso) => proceso.estado === 'PAUSADO')
    || procesos.find((proceso) => proceso.estado === 'PENDIENTE')
    || procesos[procesos.length - 1]
    || null
  );
}

export default function OrdenProduccionPrintDocument({
  produccion,
  clientes = [],
  materiales = [],
  formatos = [],
  maquinas = [],
}) {
  if (!produccion) return null;

  const cliente = getCliente(clientes, produccion.cliente_id);
  const procesoActual = getProcesoActual(produccion);
  const acabados = getAcabados(produccion);
  const juegosImpresion = usesPlateGames(produccion.tipo_impresion) ? asArray(produccion.juegos_impresion) : [];
  const juegosImpresionTexto = juegosImpresion.length
    ? juegosImpresion.map((juego) => juego.codigo_lado).join(' | ')
    : '-';
  const cantidadDemasia = produccion.demasia
    ? `${formatNumber(produccion.cantidad)} + ${formatNumber(produccion.demasia)}`
    : formatNumber(produccion.cantidad);

  return (
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
            <strong>{produccion.tipo_origen === 'SERVICIO' ? 'SERVICIO' : 'ORDEN DE TRABAJO'}</strong>
          </div>
          <div>
            <span>Documento fiscal</span>
            <strong>{cliente?.documento || '-'}</strong>
          </div>
          <div>
            <span>Estado</span>
            <strong>{formatStatus(produccion.estado)}</strong>
          </div>
          <div>
            <span>Proceso actual</span>
            <strong>{procesoActual?.tipo_proceso || '-'}</strong>
          </div>
          <div>
            <span>Orden de trabajo</span>
            <strong>{produccion.orden_trabajo_id ? `OT #${produccion.orden_trabajo_id}` : '-'}</strong>
          </div>
          <div>
            <span>Servicio</span>
            <strong>{formatStatus(produccion.tipo_servicio)}</strong>
          </div>
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
            <span>Formato</span>
            <strong>{getName(formatos, produccion.formato_id)}</strong>
          </div>
          <div>
            <span>Material</span>
            <strong>{getName(materiales, produccion.material_id)}</strong>
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
            <span>Juegos de placas</span>
            <strong>{juegosImpresion.length || '-'}</strong>
          </div>
          <div>
            <span>Codigo interno</span>
            <strong>{formatOrderCode('OP', produccion.codigo, produccion.id)}</strong>
          </div>
          <div className="production-print-wide">
            <span>Detalle de placas</span>
            <strong>{juegosImpresionTexto}</strong>
          </div>
          <div className="production-print-wide">
            <span>Procesos acabados</span>
            <strong>{acabados.length ? acabados.join(' | ') : '-'}</strong>
          </div>
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

      <footer className="production-print-footer">Orden interna MultiBur</footer>
    </article>
  );
}
