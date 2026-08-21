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

export async function buscarPorId(id, executor) {
  const { rows } = await executarConsulta(
    executor,
    `
      SELECT id_pesquisador, id_conta, nome, numero_lattes, email, vinculo, origem
      FROM pesquisador
      WHERE id_pesquisador = $1
      LIMIT 1
    `,
    [id],
  );

  return mapearPesquisadorDetalhe(rows[0]);
}

export async function buscarPorIdConta(idConta, executor) {
  const { rows } = await executarConsulta(
    executor,
    `
      SELECT id_pesquisador, id_conta, nome, numero_lattes, email, vinculo, origem
      FROM pesquisador
      WHERE id_conta = $1
      LIMIT 1
    `,
    [idConta],
  );

  return mapearPesquisadorDetalhe(rows[0]);
}

export async function buscarPorNumeroLattes(numeroLattes, executor) {
  const { rows } = await executarConsulta(
    executor,
    `
      SELECT id_pesquisador, id_conta, nome, numero_lattes, email, vinculo, origem
      FROM pesquisador
      WHERE numero_lattes = $1
      LIMIT 1
    `,
    [normalizarNumeroLattes(numeroLattes)],
  );

  return mapearPesquisadorDetalhe(rows[0]);
}

export async function criarManual(executor, { nome, numeroLattes, email, vinculo }) {
  const { rows } = await executor.query(
    `
      INSERT INTO pesquisador (nome, numero_lattes, email, vinculo, origem)
      VALUES ($1, $2, $3, $4, 'manual')
      ON CONFLICT (numero_lattes) DO NOTHING
      RETURNING id_pesquisador, id_conta, nome, numero_lattes, email, vinculo, origem
    `,
    [nome, normalizarNumeroLattes(numeroLattes), email || '', vinculo],
  );

  return mapearPesquisadorDetalhe(rows[0]);
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

function mapearPesquisadorDetalhe(linha) {
  if (!linha) {
    return null;
  }

  return {
    id: linha.id_pesquisador,
    idConta: linha.id_conta,
    nome: linha.nome,
    numeroLattes: linha.numero_lattes,
    email: linha.email,
    vinculo: linha.vinculo,
    origem: linha.origem,
  };
}

function normalizarNumeroLattes(numeroLattes) {
  return String(numeroLattes ?? '').trim();
}

function executarConsulta(executor, sql, parametros) {
  if (executor) {
    return executor.query(sql, parametros);
  }

  return consultar(sql, parametros);
}
