import { consultar } from '../config/bd.js';

const consultaUsuarioBase = `
  SELECT
    c.id_conta,
    c.email,
    c.senha_hash,
    c.tipo,
    c.data_criacao,
    a.nome AS nome_aluno,
    p.nome AS nome_pesquisador
  FROM conta c
  LEFT JOIN aluno a ON a.id_conta = c.id_conta
  LEFT JOIN pesquisador p ON p.id_conta = c.id_conta
`;

export function normalizarEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

export async function criarConta(executor, { email, senhaHash, tipo }) {
  const { rows } = await executor.query(
    `
      INSERT INTO conta (email, senha_hash, tipo)
      VALUES ($1, $2, $3)
      RETURNING id_conta, email, senha_hash, tipo, data_criacao
    `,
    [normalizarEmail(email), senhaHash, tipo],
  );

  return mapearConta(rows[0]);
}

export async function criarAluno(executor, { idConta, idCurso, nome, matricula }) {
  const { rows } = await executor.query(
    `
      INSERT INTO aluno (id_conta, id_curso, nome, matricula)
      VALUES ($1, $2, $3, $4)
      RETURNING id_aluno, id_conta, id_curso, nome, matricula
    `,
    [idConta, idCurso, nome, matricula],
  );

  return rows[0];
}

export async function criarPesquisador(executor, { idConta, nome, email, numeroLattes, vinculo }) {
  const { rows } = await executor.query(
    `
      INSERT INTO pesquisador (id_conta, nome, numero_lattes, email, vinculo, origem)
      VALUES ($1, $2, $3, $4, $5, 'manual')
      RETURNING id_pesquisador, id_conta, nome, numero_lattes, email, vinculo, origem
    `,
    [idConta, nome, normalizarNumeroLattes(numeroLattes), normalizarEmail(email), vinculo],
  );

  return rows[0];
}

export async function vincularPesquisador(executor, { idConta, numeroLattes }) {
  const { rows } = await executor.query(
    `
      UPDATE pesquisador
      SET id_conta = $1
      WHERE numero_lattes = $2 AND id_conta IS NULL
      RETURNING id_pesquisador, id_conta, nome, numero_lattes, email, vinculo, origem
    `,
    [idConta, normalizarNumeroLattes(numeroLattes)],
  );

  return rows[0] ?? null;
}

export async function buscarPorEmail(email) {
  const { rows } = await consultar(
    `${consultaUsuarioBase} WHERE c.email = $1 LIMIT 1`,
    [normalizarEmail(email)],
  );

  return mapearUsuario(rows[0]);
}

export async function buscarPorId(id) {
  const { rows } = await consultar(`${consultaUsuarioBase} WHERE c.id_conta = $1 LIMIT 1`, [id]);
  return mapearUsuario(rows[0]);
}

export async function buscarUsuarioPorId(executor, id) {
  const { rows } = await executor.query(`${consultaUsuarioBase} WHERE c.id_conta = $1 LIMIT 1`, [id]);
  return mapearUsuario(rows[0]);
}

export async function listarTodos() {
  const { rows } = await consultar(`${consultaUsuarioBase} ORDER BY c.id_conta ASC`);
  return rows.map(mapearUsuario);
}

export async function buscarAlunoPorMatricula(matricula) {
  const { rows } = await consultar(
    `
      SELECT id_aluno, id_conta, id_curso, nome, matricula
      FROM aluno
      WHERE matricula = $1
      LIMIT 1
    `,
    [String(matricula ?? '').trim()],
  );

  return rows[0] ?? null;
}

export async function buscarPesquisadorPorLattes(numeroLattes) {
  const { rows } = await consultar(
    `
      SELECT id_pesquisador, id_conta, nome, numero_lattes, email, vinculo, origem
      FROM pesquisador
      WHERE numero_lattes = $1
      LIMIT 1
    `,
    [normalizarNumeroLattes(numeroLattes)],
  );

  return mapearPesquisador(rows[0]);
}

export async function buscarPerfilPorId(id) {
  const { rows } = await consultar(
    `
      SELECT
        c.id_conta,
        c.email,
        c.tipo,
        c.data_criacao,
        a.nome AS nome_aluno,
        a.matricula,
        cu.id_curso,
        cu.nome_curso,
        p.nome AS nome_pesquisador,
        p.numero_lattes,
        p.vinculo,
        p.origem
      FROM conta c
      LEFT JOIN aluno a ON a.id_conta = c.id_conta
      LEFT JOIN curso cu ON cu.id_curso = a.id_curso
      LEFT JOIN pesquisador p ON p.id_conta = c.id_conta
      WHERE c.id_conta = $1
      LIMIT 1
    `,
    [id],
  );

  return mapearPerfil(rows[0]);
}

function normalizarNumeroLattes(numeroLattes) {
  return String(numeroLattes ?? '').trim();
}

function mapearConta(linha) {
  if (!linha) {
    return null;
  }

  return {
    id: linha.id_conta,
    email: linha.email,
    senhaHash: linha.senha_hash,
    tipo: linha.tipo,
    criadoEm: linha.data_criacao instanceof Date ? linha.data_criacao.toISOString() : linha.data_criacao,
  };
}

function mapearUsuario(linha) {
  if (!linha) {
    return null;
  }

  return {
    ...mapearConta(linha),
    nome: linha.nome_aluno ?? linha.nome_pesquisador ?? null,
  };
}

function mapearPesquisador(linha) {
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

function mapearPerfil(linha) {
  const usuario = mapearUsuario(linha);
  if (!usuario) {
    return null;
  }

  if (usuario.tipo === 'aluno') {
    return {
      ...usuario,
      perfil: {
        matricula: linha.matricula,
        curso: {
          id: linha.id_curso,
          nome: linha.nome_curso,
        },
      },
    };
  }

  if (usuario.tipo === 'pesquisador') {
    return {
      ...usuario,
      perfil: {
        numeroLattes: linha.numero_lattes,
        vinculo: linha.vinculo,
        origem: linha.origem,
      },
    };
  }

  return {
    ...usuario,
    perfil: null,
  };
}
