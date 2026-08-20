import { ErroHttp } from '../erros/ErroHttp.js';
import * as repositorioPublicacoes from '../models/repositorioPublicacoes.js';
import {
  validarEnumOpcional,
  validarId,
  validarInteiroOpcional,
  validarPaginacao,
} from './consultaParametrosService.js';

const TIPOS_PUBLICACAO = ['artigo', 'capitulo', 'resumo'];

export async function listar(filtros) {
  const paginacao = validarPaginacao(filtros);
  const tipo = validarEnumOpcional(
    filtros.tipo,
    TIPOS_PUBLICACAO,
    'O tipo deve ser artigo, capítulo ou resumo.',
  );
  const ano = validarInteiroOpcional(filtros.ano, 'O ano deve ser um número inteiro.');
  const idProjeto = validarInteiroOpcional(filtros.idProjeto, 'O id do projeto deve ser um número inteiro.');
  const idPesquisador = validarInteiroOpcional(
    filtros.idPesquisador,
    'O id do pesquisador deve ser um número inteiro.',
  );
  const resultado = await repositorioPublicacoes.listar({
    busca: filtros.busca,
    tipo,
    ano,
    idProjeto,
    idPesquisador,
    limite: paginacao.limite,
    deslocamento: paginacao.deslocamento,
  });

  return {
    publicacoes: resultado.itens,
    paginacao: {
      pagina: paginacao.pagina,
      porPagina: paginacao.porPagina,
      total: resultado.total,
    },
  };
}

export async function buscarPorId(valorId) {
  const id = validarId(valorId);
  const publicacao = await repositorioPublicacoes.buscarPorId(id);

  if (!publicacao) {
    throw new ErroHttp(404, 'Publicação não encontrada.');
  }

  return publicacao;
}
