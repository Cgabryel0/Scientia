import { ErroHttp } from '../erros/ErroHttp.js';
import * as repositorioProjetos from '../models/repositorioProjetos.js';
import {
  validarEnumOpcional,
  validarId,
  validarInteiroOpcional,
  validarPaginacao,
} from './consultaParametrosService.js';

const STATUS_PROJETO = ['planejado', 'em_andamento', 'concluido', 'cancelado'];

export async function listar(filtros) {
  const paginacao = validarPaginacao(filtros);
  const status = validarEnumOpcional(
    filtros.status,
    STATUS_PROJETO,
    'O status deve ser planejado, em_andamento, concluido ou cancelado.',
  );
  const idGrupo = validarInteiroOpcional(filtros.idGrupo, 'O id do grupo deve ser um número inteiro.');
  const idArea = validarInteiroOpcional(filtros.idArea, 'O id da área deve ser um número inteiro.');
  const resultado = await repositorioProjetos.listar({
    busca: filtros.busca,
    status,
    idGrupo,
    idArea,
    limite: paginacao.limite,
    deslocamento: paginacao.deslocamento,
  });

  return {
    projetos: resultado.itens,
    paginacao: {
      pagina: paginacao.pagina,
      porPagina: paginacao.porPagina,
      total: resultado.total,
    },
  };
}

export async function buscarPorId(valorId) {
  const id = validarId(valorId);
  const projeto = await repositorioProjetos.buscarPorId(id);

  if (!projeto) {
    throw new ErroHttp(404, 'Projeto não encontrado.');
  }

  return projeto;
}
