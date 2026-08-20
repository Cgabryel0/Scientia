import { consultar } from '../config/bd.js';

export async function buscarPorId(id) {
  const { rows } = await consultar(
    `
      SELECT id_curso, nome_curso
      FROM curso
      WHERE id_curso = $1
      LIMIT 1
    `,
    [id],
  );

  return mapearCurso(rows[0]);
}

export async function listarTodos() {
  const { rows } = await consultar(
    `
      SELECT id_curso, nome_curso
      FROM curso
      ORDER BY nome_curso ASC
    `,
  );

  return rows.map(mapearCurso);
}

function mapearCurso(linha) {
  if (!linha) {
    return null;
  }

  return {
    id: linha.id_curso,
    nome: linha.nome_curso,
  };
}
