import { consultar } from '../config/bd.js';
import { montarPadraoBusca } from './buscaTextual.js';

export async function listar({ busca, vinculo, limite, deslocamento }) {
  const { clausula, parametros } = montarFiltros({ busca, vinculo });
  const total = await contar(clausula, parametros);
  const parametrosLista = [...parametros, limite, deslocamento];
  const indiceLimite = parametrosLista.length - 1;
  const indiceDeslocamento = parametrosLista.length;
  const { rows } = await consultar(
    `
      SELECT
        pe.id_pesquisador,
        pe.nome,
        pe.vinculo,
        pe.numero_lattes,
        (
          SELECT COUNT(*)::int
          FROM autoria a
          WHERE a.id_pesquisador = pe.id_pesquisador
        ) AS total_publicacoes
      FROM pesquisador pe
      ${clausula}
      ORDER BY pe.nome ASC, pe.id_pesquisador ASC
      LIMIT $${indiceLimite} OFFSET $${indiceDeslocamento}
    `,
    parametrosLista,
  );

  return { itens: rows.map(mapearPesquisador), total };
}

async function contar(clausula, parametros) {
  const { rows } = await consultar(
    `
      SELECT COUNT(*)::int AS total
      FROM pesquisador pe
      ${clausula}
    `,
    parametros,
  );

  return rows[0].total;
}

function montarFiltros({ busca, vinculo }) {
  const filtros = [];
  const parametros = [];

  if (busca) {
    parametros.push(montarPadraoBusca(busca));
    filtros.push(`pe.nome ILIKE $${parametros.length} ESCAPE '\\'`);
  }

  if (vinculo) {
    parametros.push(vinculo);
    filtros.push(`pe.vinculo = $${parametros.length}`);
  }

  return {
    clausula: filtros.length ? `WHERE ${filtros.join(' AND ')}` : '',
    parametros,
  };
}

function mapearPesquisador(linha) {
  if (!linha) {
    return null;
  }

  return {
    id: linha.id_pesquisador,
    nome: linha.nome,
    vinculo: linha.vinculo,
    numeroLattes: linha.numero_lattes,
    totalPublicacoes: linha.total_publicacoes,
  };
}
