import { requisitar } from './api.js';

/** Só o ADMIN consegue essa lista, o backend recusa os demais com 403. */
export function listar(token) {
  return requisitar('/usuarios', { token });
}
