import { consultar } from '../config/bd.js';

export async function listar({ idAluno, idVaga, status, limite, deslocamento }) {
  const { clausula, parametros } = montarFiltros({ idAluno, idVaga, status });
  const total = await contar(clausula, parametros);
  const parametrosLista = [...parametros, limite, deslocamento];
  const indiceLimite = parametrosLista.length - 1;
  const indiceDeslocamento = parametrosLista.length;
  const { rows } = await consultar(
    `
      SELECT
        c.id_aluno,
        a.nome AS nome_aluno,
        a.matricula,
        c.id_vaga,
        v.titulo AS titulo_vaga,
        v.id_projeto,
        pr.titulo AS titulo_projeto,
        c.status,
        c.data_candidatura
      FROM candidatura c
      JOIN aluno a ON a.id_aluno = c.id_aluno
      JOIN vaga v ON v.id_vaga = c.id_vaga
      JOIN projeto_pesquisa pr ON pr.id_projeto = v.id_projeto
      ${clausula}
      ORDER BY c.data_candidatura DESC, c.id_vaga DESC, c.id_aluno ASC
      LIMIT $${indiceLimite} OFFSET $${indiceDeslocamento}
    `,
    parametrosLista,
  );

  return { itens: rows.map(mapearCandidatura), total };
}

export async function buscarPorId(idAluno, idVaga, executor) {
  const { rows } = await executarConsulta(
    executor,
    `
      SELECT
        c.id_aluno,
        a.nome AS nome_aluno,
        a.matricula,
        c.id_vaga,
        v.titulo AS titulo_vaga,
        v.id_projeto,
        pr.titulo AS titulo_projeto,
        c.status,
        c.data_candidatura
      FROM candidatura c
      JOIN aluno a ON a.id_aluno = c.id_aluno
      JOIN vaga v ON v.id_vaga = c.id_vaga
      JOIN projeto_pesquisa pr ON pr.id_projeto = v.id_projeto
      WHERE c.id_aluno = $1 AND c.id_vaga = $2
      LIMIT 1
    `,
    [idAluno, idVaga],
  );

  return mapearCandidatura(rows[0]);
}

export async function buscarAlunoPorConta(idConta, executor) {
  const { rows } = await executarConsulta(
    executor,
    'SELECT id_aluno FROM aluno WHERE id_conta = $1 LIMIT 1',
    [idConta],
  );

  return rows[0]?.id_aluno ?? null;
}

export async function alunoExiste(idAluno, executor) {
  const { rows } = await executarConsulta(
    executor,
    'SELECT 1 FROM aluno WHERE id_aluno = $1 LIMIT 1',
    [idAluno],
  );

  return rows.length > 0;
}

export async function criar(executor, { idAluno, idVaga, status, dataCandidatura }) {
  await executor.query(
    `
      INSERT INTO candidatura (id_aluno, id_vaga, status, data_candidatura)
      VALUES ($1, $2, $3, $4)
    `,
    [idAluno, idVaga, status, dataCandidatura],
  );
}

export async function atualizarStatus(executor, idAluno, idVaga, status) {
  const resultado = await executor.query(
    `
      UPDATE candidatura
      SET status = $3
      WHERE id_aluno = $1 AND id_vaga = $2
    `,
    [idAluno, idVaga, status],
  );

  return resultado.rowCount > 0;
}

export async function excluir(executor, idAluno, idVaga) {
  const resultado = await executor.query(
    'DELETE FROM candidatura WHERE id_aluno = $1 AND id_vaga = $2',
    [idAluno, idVaga],
  );

  return resultado.rowCount > 0;
}

async function contar(clausula, parametros) {
  const { rows } = await consultar(
    `SELECT COUNT(*)::int AS total FROM candidatura c ${clausula}`,
    parametros,
  );
  return rows[0].total;
}

function montarFiltros({ idAluno, idVaga, status }) {
  const filtros = [];
  const parametros = [];

  if (idAluno !== undefined) {
    parametros.push(idAluno);
    filtros.push(`c.id_aluno = $${parametros.length}`);
  }

  if (idVaga !== undefined) {
    parametros.push(idVaga);
    filtros.push(`c.id_vaga = $${parametros.length}`);
  }

  if (status) {
    parametros.push(status);
    filtros.push(`c.status = $${parametros.length}`);
  }

  return {
    clausula: filtros.length ? `WHERE ${filtros.join(' AND ')}` : '',
    parametros,
  };
}

function mapearCandidatura(linha) {
  if (!linha) {
    return null;
  }

  return {
    aluno: {
      id: linha.id_aluno,
      nome: linha.nome_aluno,
      matricula: linha.matricula,
    },
    vaga: {
      id: linha.id_vaga,
      titulo: linha.titulo_vaga,
      projeto: {
        id: linha.id_projeto,
        titulo: linha.titulo_projeto,
      },
    },
    status: linha.status,
    dataCandidatura: formatarData(linha.data_candidatura),
  };
}

function formatarData(valor) {
  if (typeof valor === 'string') {
    return valor.slice(0, 10);
  }

  return valor.toISOString().slice(0, 10);
}

function executarConsulta(executor, sql, parametros) {
  if (executor) {
    return executor.query(sql, parametros);
  }

  return consultar(sql, parametros);
}
