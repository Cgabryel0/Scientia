import { montarConsulta, requisitar } from './api.js';

export function listar(filtros) {
  return requisitar(`/projetos${montarConsulta(filtros)}`);
}

export function buscarPorId(id) {
  return requisitar(`/projetos/${id}`);
}

export function cadastrar(dados, token) {
  return requisitar('/projetos', { metodo: 'POST', corpo: dados, token });
}

export function atualizar(id, dados, token) {
  return requisitar(`/projetos/${id}`, { metodo: 'PUT', corpo: dados, token });
}

export function excluir(id, token) {
  return requisitar(`/projetos/${id}`, { metodo: 'DELETE', token });
}
