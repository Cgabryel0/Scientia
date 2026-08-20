import * as repositorioPesquisadores from '../models/repositorioPesquisadores.js';
import { validarEnumOpcional, validarPaginacao } from './consultaParametrosService.js';

const VINCULOS_PESQUISADOR = ['docente', 'discente', 'externo'];

export async function listar(filtros) {
  const paginacao = validarPaginacao(filtros);
  const vinculo = validarEnumOpcional(
    filtros.vinculo,
    VINCULOS_PESQUISADOR,
    'O vínculo deve ser docente, discente ou externo.',
  );
  const resultado = await repositorioPesquisadores.listar({
    busca: filtros.busca,
    vinculo,
    limite: paginacao.limite,
    deslocamento: paginacao.deslocamento,
  });

  return {
    pesquisadores: resultado.itens,
    paginacao: {
      pagina: paginacao.pagina,
      porPagina: paginacao.porPagina,
      total: resultado.total,
    },
  };
}
