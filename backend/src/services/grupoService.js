import { ErroHttp } from '../erros/ErroHttp.js';
import * as repositorioGrupos from '../models/repositorioGrupos.js';
import { validarId, validarPaginacao } from './consultaParametrosService.js';

export async function listar(filtros) {
  const paginacao = validarPaginacao(filtros);
  const resultado = await repositorioGrupos.listar({
    busca: filtros.busca,
    limite: paginacao.limite,
    deslocamento: paginacao.deslocamento,
  });

  return {
    grupos: resultado.itens,
    paginacao: {
      pagina: paginacao.pagina,
      porPagina: paginacao.porPagina,
      total: resultado.total,
    },
  };
}

export async function buscarPorId(valorId) {
  const id = validarId(valorId);
  const grupo = await repositorioGrupos.buscarPorId(id);

  if (!grupo) {
    throw new ErroHttp(404, 'Grupo não encontrado.');
  }

  return grupo;
}
