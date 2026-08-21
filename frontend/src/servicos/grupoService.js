import { montarConsulta, requisitar } from './api.js';

export function listar(filtros) {
  return requisitar(`/grupos${montarConsulta(filtros)}`);
}

export function buscarPorId(id) {
  return requisitar(`/grupos/${id}`);
}

export function cadastrar(dados, token) {
  return requisitar('/grupos', { metodo: 'POST', corpo: dados, token });
}
