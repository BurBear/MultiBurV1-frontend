import test from 'node:test';
import assert from 'node:assert/strict';
import { getRowsForMenu } from '../src/utils/pizarraOperador.js';

function row(id, estado, options = {}) {
  return {
    id, proceso: { estado, operador_id: 1 }, puedeIniciar: true,
    isLocked: false, isTrabajoActual: estado === 'EN_PROCESO', ...options,
  };
}

const disponibles = (rows, userId = 1) => getRowsForMenu(rows, 'DISPONIBLES', userId).map(({ id }) => id);

test('todas las ordenes siguen visibles al pausar un segundo o tercer trabajo', () => {
  const rows = [row(1, 'PAUSADO'), row(2, 'EN_PROCESO'), row(3, 'PENDIENTE')];
  assert.deepEqual(disponibles(rows), [1, 2, 3]);
  rows[1] = row(2, 'PAUSADO');
  assert.deepEqual(disponibles(rows), [1, 2, 3]);
  rows[2] = row(3, 'PAUSADO');
  assert.deepEqual(disponibles(rows), [1, 2, 3]);
});

test('las propias pausadas siguen visibles cuando otra ejecucion impide reanudarlas', () => {
  const rows = [row(1, 'PAUSADO', { isLocked: true }), row(2, 'PAUSADO', { isLocked: true }), row(3, 'EN_PROCESO')];
  assert.deepEqual(disponibles(rows), [1, 2, 3]);
  assert.equal(rows[0].isLocked, true);
});

test('T+R conserva las ordenes con lados propios pausados aunque el proceso padre no tenga operador', () => {
  const rows = [1, 2].map((id) => row(id, 'PAUSADO', {
    isJuegosImpresion: true, isLocked: true,
    proceso: { estado: 'PAUSADO', operador_id: null },
    juegos: [{ estado: 'PAUSADO', operador_id: 1 }, { estado: 'BLOQUEADO', operador_id: 1 }],
  }));
  rows.push(row(3, 'EN_PROCESO'));
  assert.deepEqual(disponibles(rows), [1, 2, 3]);
});

test('las pausadas ajenas no se consideran trabajos propios', () => {
  const rows = [row(1, 'PAUSADO', { isLocked: true, proceso: { estado: 'PAUSADO', operador_id: 2 } }),
    row(2, 'PAUSADO', { isJuegosImpresion: true, isLocked: true, juegos: [{ estado: 'PAUSADO', operador_id: 2 }] })];
  assert.deepEqual(disponibles(rows), []);
  assert.deepEqual(getRowsForMenu(rows, 'BLOQUEADAS', 1).map(({ id }) => id), [1, 2]);
});

test('se conservan los filtros de pendientes, terminadas y bloqueadas por secuencia', () => {
  const rows = [row(1, 'PENDIENTE'), row(2, 'TERMINADO'), row(3, 'PENDIENTE', { puedeIniciar: false })];
  assert.deepEqual(disponibles(rows), [1]);
  assert.deepEqual(getRowsForMenu(rows, 'TERMINADO', 1).map(({ id }) => id), [2]);
  assert.deepEqual(getRowsForMenu(rows, 'BLOQUEADAS', 1).map(({ id }) => id), [3]);
});

test('la propiedad admite ids serializados como texto y no considera un operador ausente', () => {
  assert.deepEqual(disponibles([row(1, 'PAUSADO')], '1'), [1]);
  assert.deepEqual(disponibles([row(1, 'PAUSADO')], null), []);
});
