import { requisitar } from './api.js';

export function listar() {
  return requisitar('/areas');
}
