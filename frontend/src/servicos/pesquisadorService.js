import { montarConsulta, requisitar } from './api.js';

export function listar(filtros) {
  return requisitar(`/pesquisadores${montarConsulta(filtros)}`);
}
