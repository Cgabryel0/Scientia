import { consultar } from '../config/bd.js';

export async function listarTodas() {
  const { rows } = await consultar(
    `
      SELECT id_area, nome_area
      FROM area_conhecimento
      ORDER BY nome_area ASC
    `,
  );

  return rows.map((linha) => ({
    id: linha.id_area,
    nome: linha.nome_area,
  }));
}
