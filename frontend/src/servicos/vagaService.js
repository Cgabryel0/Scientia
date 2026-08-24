import { montarConsulta, requisitar } from './api.js';

export function listar(filtros) {
  return requisitar(`/vagas${montarConsulta(filtros)}`);
}

export function buscarPorId(id) {
  return requisitar(`/vagas/${id}`);
}

export function cadastrar(dados, token) {
  return requisitar('/vagas', { metodo: 'POST', corpo: dados, token });
}

export function atualizar(id, dados, token) {
  return requisitar(`/vagas/${id}`, { metodo: 'PUT', corpo: dados, token });
}

export function excluir(id, token) {
  return requisitar(`/vagas/${id}`, { metodo: 'DELETE', token });
}
