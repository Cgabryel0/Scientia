import { consultar } from '../config/bd.js';

export async function listarTodos() {
  const { rows } = await consultar(
    `
      SELECT id_edital, nome_edital, ano
      FROM edital
      ORDER BY ano DESC, nome_edital ASC
    `,
  );

  return rows.map(mapearEdital);
}

function mapearEdital(linha) {
  return {
    id: linha.id_edital,
    nome: linha.nome_edital,
    ano: linha.ano,
  };
}
