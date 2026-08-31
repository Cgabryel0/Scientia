import { consultar } from '../config/bd.js';

export async function buscarProducoesConsolidadas() {
  const [total, porAno, porTipo, porArea] = await Promise.all([
    consultar(`
      SELECT COUNT(*)::int AS total
      FROM publicacao
    `),
    consultar(`
      SELECT
        ano,
        COUNT(*)::int AS quantidade
      FROM publicacao
      GROUP BY ano
      ORDER BY ano ASC
    `),
    consultar(`
      SELECT
        tipo,
        COUNT(*)::int AS quantidade
      FROM publicacao
      GROUP BY tipo
      ORDER BY quantidade DESC, tipo ASC
    `),
    consultar(`
      SELECT
        ar.id_area,
        ar.nome_area,
        COUNT(ap.id_publicacao)::int AS quantidade
      FROM area_conhecimento ar
      LEFT JOIN area_publicacao ap ON ap.id_area = ar.id_area
      GROUP BY ar.id_area, ar.nome_area
      ORDER BY quantidade DESC, ar.nome_area ASC, ar.id_area ASC
    `),
  ]);

  return {
    totalProducoes: total.rows[0].total,
    porAno: porAno.rows.map(mapearQuantidadePorAno),
    porTipo: porTipo.rows.map(mapearQuantidadePorTipo),
    porArea: porArea.rows.map(mapearQuantidadePorArea),
  };
}

function mapearQuantidadePorAno(linha) {
  return {
    ano: linha.ano,
    quantidade: linha.quantidade,
  };
}

function mapearQuantidadePorTipo(linha) {
  return {
    tipo: linha.tipo,
    quantidade: linha.quantidade,
  };
}

function mapearQuantidadePorArea(linha) {
  return {
    idArea: linha.id_area,
    nome: linha.nome_area,
    quantidade: linha.quantidade,
  };
}
