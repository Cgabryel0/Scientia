import { consultar } from '../config/bd.js';

export async function listarProjetos() {
  const { rows } = await consultar(`
    SELECT
      id_projeto,
      titulo,
      status,
      data_inicio,
      data_fim,
      id_grupo,
      nome_grupo,
      id_edital,
      nome_edital,
      ano_edital,
      quantidade_publicacoes
    FROM v_projetos_detalhados
    ORDER BY data_inicio DESC, id_projeto DESC
  `);

  return rows.map(mapearProjeto);
}

export async function listarPublicacoes() {
  const { rows } = await consultar(`
    SELECT
      id_publicacao,
      titulo_publicacao,
      tipo,
      ano,
      veiculo,
      doi,
      id_projeto,
      titulo_projeto,
      id_grupo,
      nome_grupo,
      id_pesquisador,
      nome_autor,
      ordem_autor
    FROM v_producao_bibliografica
    ORDER BY ano DESC, id_publicacao DESC, ordem_autor ASC NULLS LAST
  `);

  return rows.map(mapearPublicacao);
}

export async function listarGrupos() {
  const { rows } = await consultar(`
    SELECT
      id_grupo,
      nome_grupo,
      ano_criacao,
      link_dgp,
      lideres,
      quantidade_pesquisadores,
      quantidade_projetos,
      projetos_em_andamento
    FROM v_grupos_pesquisa
    ORDER BY nome_grupo ASC, id_grupo ASC
  `);

  return rows.map(mapearGrupo);
}

function mapearProjeto(linha) {
  return {
    idProjeto: linha.id_projeto,
    titulo: linha.titulo,
    status: linha.status,
    dataInicio: formatarData(linha.data_inicio),
    dataFim: formatarData(linha.data_fim),
    idGrupo: linha.id_grupo,
    nomeGrupo: linha.nome_grupo,
    idEdital: linha.id_edital,
    nomeEdital: linha.nome_edital,
    anoEdital: linha.ano_edital,
    quantidadePublicacoes: linha.quantidade_publicacoes,
  };
}

function mapearPublicacao(linha) {
  return {
    idPublicacao: linha.id_publicacao,
    tituloPublicacao: linha.titulo_publicacao,
    tipo: linha.tipo,
    ano: linha.ano,
    veiculo: linha.veiculo,
    doi: linha.doi,
    idProjeto: linha.id_projeto,
    tituloProjeto: linha.titulo_projeto,
    idGrupo: linha.id_grupo,
    nomeGrupo: linha.nome_grupo,
    idPesquisador: linha.id_pesquisador,
    nomeAutor: linha.nome_autor,
    ordemAutor: linha.ordem_autor,
  };
}

function mapearGrupo(linha) {
  return {
    idGrupo: linha.id_grupo,
    nomeGrupo: linha.nome_grupo,
    anoCriacao: linha.ano_criacao,
    linkDgp: linha.link_dgp,
    lideres: linha.lideres,
    quantidadePesquisadores: linha.quantidade_pesquisadores,
    quantidadeProjetos: linha.quantidade_projetos,
    projetosEmAndamento: linha.projetos_em_andamento,
  };
}

function formatarData(valor) {
  if (!valor) {
    return null;
  }

  if (typeof valor === 'string') {
    return valor.slice(0, 10);
  }

  return valor.toISOString().slice(0, 10);
}
