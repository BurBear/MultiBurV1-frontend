export const ROLES = {
  ADMIN: 'ADMIN',
  OPERADOR_IMPRESION: 'OPERADOR_IMPRESION',
  OPERADOR_ACABADOS: 'OPERADOR_ACABADOS',
};

export function isAdmin(user) {
  return user?.rol === ROLES.ADMIN;
}

export function isOperator(user) {
  return [ROLES.OPERADOR_IMPRESION, ROLES.OPERADOR_ACABADOS].includes(user?.rol);
}

export function getRoleDestination(rol) {
  return rol === ROLES.ADMIN ? 'ADMIN' : 'OPERADOR';
}

export function isKnownRole(rol) {
  return Object.values(ROLES).includes(rol);
}

export function getStationFromRole(rol) {
  if (rol === ROLES.OPERADOR_IMPRESION) return 'IMPRESION';
  if (rol === ROLES.OPERADOR_ACABADOS) return 'ACABADOS';
  if (rol === ROLES.ADMIN) return 'DISEÑO';
  return 'GENERAL';
}

export function getRoleLabel(rol) {
  const labels = {
    [ROLES.ADMIN]: 'Administrador',
    [ROLES.OPERADOR_IMPRESION]: 'Operador de impresion',
    [ROLES.OPERADOR_ACABADOS]: 'Operador de acabados',
  };

  return labels[rol] || rol || 'Rol no definido';
}
