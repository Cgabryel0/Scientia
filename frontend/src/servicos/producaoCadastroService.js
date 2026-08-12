import { requisitar } from './api.js';

export function cadastrar(dados, token) {
  return requisitar('/producoes', { metodo: 'POST', corpo: dados, token });
}
