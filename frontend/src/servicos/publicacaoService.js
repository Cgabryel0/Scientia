import { montarConsulta, requisitar } from './api.js';

export function listar(filtros) {
  return requisitar(`/publicacoes${montarConsulta(filtros)}`);
}

export function buscarPorId(id) {
  return requisitar(`/publicacoes/${id}`);
}

export function cadastrar(dados, token) {
  return requisitar('/publicacoes', { metodo: 'POST', corpo: dados, token });
}
