import { montarConsulta, requisitar } from './api.js';

export function listar(filtros, token) {
  return requisitar(`/candidaturas${montarConsulta(filtros)}`, { token });
}

export function cadastrar(dados, token) {
  return requisitar('/candidaturas', { metodo: 'POST', corpo: dados, token });
}

export function atualizar(idAluno, idVaga, dados, token) {
  return requisitar(`/candidaturas/${idAluno}/${idVaga}`, {
    metodo: 'PUT',
    corpo: dados,
    token,
  });
}

export function excluir(idAluno, idVaga, token) {
  return requisitar(`/candidaturas/${idAluno}/${idVaga}`, { metodo: 'DELETE', token });
}
