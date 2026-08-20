import { montarConsulta, requisitar } from './api.js';

export function listar(filtros) {
  return requisitar(`/publicacoes${montarConsulta(filtros)}`);
}

export function buscarPorId(id) {
  return requisitar(`/publicacoes/${id}`);
}
