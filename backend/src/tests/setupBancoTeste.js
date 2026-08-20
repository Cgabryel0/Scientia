import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const caminhoSchema = resolve(__dirname, '../../../database/init/01-schema.sql');
const cursosMinimos = [
  'Bacharelado em Ciência da Computação',
  'Licenciatura em Computação',
  'Bacharelado em Agronomia',
];

export async function prepararBancoTeste() {
  await garantirBancoTeste();
  await aplicarSchemaSeNecessario();
}

export async function reiniciarBancoTeste() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query(`
      TRUNCATE
        candidatura,
        autoria,
        possui_area,
        participacao,
        membro,
        vaga,
        publicacao,
        area_conhecimento,
        projeto_pesquisa,
        grupo_pesquisa,
        edital,
        pesquisador,
        aluno,
        conta,
        curso
      RESTART IDENTITY CASCADE
    `);

    for (const nome of cursosMinimos) {
      await pool.query('INSERT INTO curso (nome_curso) VALUES ($1) ON CONFLICT DO NOTHING', [nome]);
    }
  } finally {
    await pool.end();
  }
}

async function garantirBancoTeste() {
  const urlTeste = new URL(process.env.DATABASE_URL);
  const nomeBanco = urlTeste.pathname.replace(/^\//, '');

  if (!/^[A-Za-z0-9_]+$/.test(nomeBanco)) {
    throw new Error('Nome do banco de teste inválido.');
  }

  const urlAdministrativa = new URL(process.env.DATABASE_URL);
  urlAdministrativa.pathname = '/scientia';
  const pool = new Pool({ connectionString: urlAdministrativa.toString() });

  try {
    const { rows } = await pool.query('SELECT 1 FROM pg_database WHERE datname = $1', [nomeBanco]);
    if (rows.length === 0) {
      await pool.query(`CREATE DATABASE ${nomeBanco}`);
    }
  } finally {
    await pool.end();
  }
}

async function aplicarSchemaSeNecessario() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rows } = await pool.query("SELECT to_regclass('public.conta') AS tabela");
    if (!rows[0].tabela) {
      const schema = await readFile(caminhoSchema, 'utf8');
      await pool.query(schema);
    }
  } finally {
    await pool.end();
  }
}
