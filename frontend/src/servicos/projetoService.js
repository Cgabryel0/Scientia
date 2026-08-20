import { montarConsulta, requisitar } from './api.js';

export function listar(filtros) {
  return requisitar(`/projetos${montarConsulta(filtros)}`);
}

export function buscarPorId(id) {
  return requisitar(`/projetos/${id}`);
}
