import { consultar } from '../config/bd.js';
import { montarPadraoBusca } from './buscaTextual.js';

export async function listar({ busca, tipo, ano, idProjeto, idPesquisador, limite, deslocamento }) {
  const { clausula, parametros } = montarFiltros({ busca, tipo, ano, idProjeto, idPesquisador });
  const total = await contar(clausula, parametros);
  const parametrosLista = [...parametros, limite, deslocamento];
  const indiceLimite = parametrosLista.length - 1;
  const indiceDeslocamento = parametrosLista.length;
  const { rows } = await consultar(
    `
      SELECT
        p.id_publicacao,
        p.titulo,
        p.tipo,
        p.ano,
        p.doi,
        p.veiculo,
        pr.id_projeto,
        pr.titulo AS titulo_projeto
      FROM publicacao p
      JOIN projeto_pesquisa pr ON pr.id_projeto = p.id_projeto
      ${clausula}
      ORDER BY p.ano DESC, p.id_publicacao DESC
      LIMIT $${indiceLimite} OFFSET $${indiceDeslocamento}
    `,
    parametrosLista,
  );

  const publicacoes = rows.map(mapearPublicacao);
  await preencherAutores(publicacoes);

  return { itens: publicacoes, total };
}

export async function buscarPorId(id) {
  const { rows } = await consultar(
    `
      SELECT
        p.id_publicacao,
        p.titulo,
        p.tipo,
        p.ano,
        p.doi,
        p.veiculo,
        pr.id_projeto,
        pr.titulo AS titulo_projeto
      FROM publicacao p
      JOIN projeto_pesquisa pr ON pr.id_projeto = p.id_projeto
      WHERE p.id_publicacao = $1
      LIMIT 1
    `,
    [id],
  );

  const publicacao = mapearPublicacao(rows[0]);

  if (!publicacao) {
    return null;
  }

  await preencherAutores([publicacao]);
  return publicacao;
}

export async function criar(executor, { titulo, tipo, ano, doi, veiculo, idProjeto }) {
  const { rows } = await executor.query(
    `
      INSERT INTO publicacao (id_projeto, tipo, ano, doi, veiculo, titulo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_publicacao
    `,
    [idProjeto, tipo, ano, doi, veiculo, titulo],
  );

  return rows[0].id_publicacao;
}

export async function criarAutoria(executor, { idPublicacao, idPesquisador, ordem }) {
  await executor.query(
    `
      INSERT INTO autoria (id_pesquisador, id_publicacao, ordem)
      VALUES ($1, $2, $3)
    `,
    [idPesquisador, idPublicacao, ordem],
  );
}

async function contar(clausula, parametros) {
  const { rows } = await consultar(
    `
      SELECT COUNT(*)::int AS total
      FROM publicacao p
      ${clausula}
    `,
    parametros,
  );

  return rows[0].total;
}

function montarFiltros({ busca, tipo, ano, idProjeto, idPesquisador }) {
  const filtros = [];
  const parametros = [];

  if (busca) {
    parametros.push(montarPadraoBusca(busca));
    filtros.push(`
      (
        p.titulo ILIKE $${parametros.length} ESCAPE '\\'
        OR EXISTS (
          SELECT 1
          FROM autoria a_busca
          JOIN pesquisador pe_busca ON pe_busca.id_pesquisador = a_busca.id_pesquisador
          WHERE a_busca.id_publicacao = p.id_publicacao
            AND pe_busca.nome ILIKE $${parametros.length} ESCAPE '\\'
        )
      )
    `);
  }

  if (tipo) {
    parametros.push(tipo);
    filtros.push(`p.tipo = $${parametros.length}`);
  }

  if (ano !== undefined) {
    parametros.push(ano);
    filtros.push(`p.ano = $${parametros.length}`);
  }

  if (idProjeto !== undefined) {
    parametros.push(idProjeto);
    filtros.push(`p.id_projeto = $${parametros.length}`);
  }

  if (idPesquisador !== undefined) {
    parametros.push(idPesquisador);
    filtros.push(`
      EXISTS (
        SELECT 1
        FROM autoria a_pesquisador
        WHERE a_pesquisador.id_publicacao = p.id_publicacao
          AND a_pesquisador.id_pesquisador = $${parametros.length}
      )
    `);
  }

  return {
    clausula: filtros.length ? `WHERE ${filtros.join(' AND ')}` : '',
    parametros,
  };
}

async function preencherAutores(publicacoes) {
  const ids = publicacoes.map((publicacao) => publicacao.id);

  if (ids.length === 0) {
    return;
  }

  const { rows } = await consultar(
    `
      SELECT
        a.id_publicacao,
        json_agg(
          json_build_object(
            'id', pe.id_pesquisador,
            'nome', pe.nome,
            'ordem', a.ordem
          )
          ORDER BY a.ordem ASC
        ) AS autores
      FROM autoria a
      JOIN pesquisador pe ON pe.id_pesquisador = a.id_pesquisador
      WHERE a.id_publicacao = ANY($1::int[])
      GROUP BY a.id_publicacao
    `,
    [ids],
  );

  const autoresPorPublicacao = new Map(rows.map((linha) => [linha.id_publicacao, linha.autores ?? []]));

  for (const publicacao of publicacoes) {
    publicacao.autores = autoresPorPublicacao.get(publicacao.id) ?? [];
  }
}

function mapearPublicacao(linha) {
  if (!linha) {
    return null;
  }

  return {
    id: linha.id_publicacao,
    titulo: linha.titulo,
    tipo: linha.tipo,
    ano: linha.ano,
    doi: linha.doi,
    veiculo: linha.veiculo,
    projeto: {
      id: linha.id_projeto,
      titulo: linha.titulo_projeto,
    },
    autores: [],
  };
}
