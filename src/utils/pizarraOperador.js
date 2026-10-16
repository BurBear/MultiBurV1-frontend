function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export function getRowEstado(row) {
  if (!row?.isJuegosImpresion) return row?.proceso?.estado;
  const juegos = asArray(row.juegos);
  if (juegos.length > 0 && juegos.every((juego) => juego.estado === 'TERMINADO')) return 'TERMINADO';
  if (row.juegoActual) return row.juegoActual.estado;
  return row.proceso?.estado || 'PENDIENTE';
}

function tieneTrabajoPausado(row, userId) {
  if (userId === null || userId === undefined) return false;
  const trabajos = row.isJuegosImpresion ? asArray(row.juegos) : [row.proceso];
  return trabajos.some((trabajo) => trabajo?.estado === 'PAUSADO'
    && trabajo.operador_id !== null && trabajo.operador_id !== undefined
    && String(trabajo.operador_id) === String(userId));
}

export function getRowsForMenu(rows, menuId, userId) {
  if (menuId === 'DISPONIBLES') {
    return rows.filter((row) => (
      row.isTrabajoActual
      || tieneTrabajoPausado(row, userId)
      || (
        row.isJuegosImpresion
          ? row.puedeIniciar && getRowEstado(row) !== 'TERMINADO' && !row.isLocked
          : row.proceso.estado === 'PENDIENTE' && row.puedeIniciar && !row.isLocked
      )
    ));
  }
  if (menuId === 'BLOQUEADAS') {
    return rows.filter((row) => row.isLocked || (getRowEstado(row) === 'PENDIENTE' && !row.puedeIniciar));
  }
  return rows.filter((row) => getRowEstado(row) === menuId);
}
