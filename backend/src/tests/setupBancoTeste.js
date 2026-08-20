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

const gruposAcervo = [
  [1, 'Grupo de Pesquisa em Agroecologia Digital', null, 2018],
  [2, 'Grupo de Pesquisa em Computação Aplicada', 'http://dgp.cnpq.br/exemplo', 2015],
];

const areasAcervo = [
  [1, 'Ciência da Computação'],
  [2, 'Agronomia'],
];

const pesquisadoresAcervo = [
  [91, 'Ana Souza', '1234567890123456', 'ana.souza@acervo.ufape.edu.br', 'docente', 'manual'],
  [104, 'Bruno Lima', '2345678901234567', 'bruno.lima@acervo.ufape.edu.br', 'discente', 'manual'],
  [117, 'Carla Rocha', '3456789012345678', 'carla.rocha@acervo.ufape.edu.br', 'externo', 'manual'],
];

const projetosAcervo = [
  [
    3,
    2,
    7,
    'Inteligência artificial aplicada ao Agreste',
    'Estuda a aplicação de aprendizado de máquina no contexto regional.',
    '2024-03-01',
    null,
    'em_andamento',
    'manual',
  ],
  [
    4,
    1,
    null,
    'Agroecologia e sistemas sustentáveis no Agreste',
    null,
    '2023-02-15',
    '2024-12-20',
    'concluido',
    'manual',
  ],
];

const publicacoesAcervo = [
  [
    1,
    3,
    'artigo',
    2024,
    '10.1000/exemplo.1',
    'Revista Brasileira de Computação',
    'Análise de desempenho de algoritmos de aprendizado',
  ],
  [
    2,
    3,
    'resumo',
    2025,
    null,
    'Anais do Congresso de IA',
    'Redes neurais para previsão climática no Agreste',
  ],
  [
    3,
    4,
    'capitulo',
    2023,
    '10.1000/exemplo.3',
    'Livro Tecnologias para o Campo',
    'Capítulo sobre agricultura digital',
  ],
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

export async function popularCenarioAcervoTeste() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query('INSERT INTO edital (id_edital, nome_edital, ano) VALUES ($1, $2, $3)', [
      7,
      'Edital Universal nº 03/2022',
      2022,
    ]);

    for (const grupo of gruposAcervo) {
      await pool.query(
        `
          INSERT INTO grupo_pesquisa (id_grupo, nome_grupo, link_dgp, ano_criacao)
          VALUES ($1, $2, $3, $4)
        `,
        grupo,
      );
    }

    for (const area of areasAcervo) {
      await pool.query('INSERT INTO area_conhecimento (id_area, nome_area) VALUES ($1, $2)', area);
    }

    for (const pesquisador of pesquisadoresAcervo) {
      await pool.query(
        `
          INSERT INTO pesquisador (id_pesquisador, nome, numero_lattes, email, vinculo, origem)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        pesquisador,
      );
    }

    for (const projeto of projetosAcervo) {
      await pool.query(
        `
          INSERT INTO projeto_pesquisa (
            id_projeto,
            id_grupo,
            id_edital,
            titulo,
            resumo,
            data_inicio,
            data_fim,
            status,
            origem
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        projeto,
      );
    }

    await pool.query('INSERT INTO possui_area (id_projeto, id_area) VALUES ($1, $2), ($3, $4)', [3, 1, 4, 2]);
    await pool.query(
      `
        INSERT INTO membro (id_pesquisador, id_grupo, papel_grupo)
        VALUES
          ($1, $2, $3),
          ($4, $5, $6),
          ($7, $8, $9)
      `,
      [91, 2, 'lider', 104, 2, 'membro', 117, 1, 'lider'],
    );
    await pool.query(
      `
        INSERT INTO participacao (id_pesquisador, id_projeto, data_entrada, papel)
        VALUES
          ($1, $2, $3, $4),
          ($5, $6, $7, $8),
          ($9, $10, $11, $12),
          ($13, $14, $15, $16)
      `,
      [
        91,
        3,
        '2024-03-01',
        'coordenador',
        104,
        3,
        '2024-03-10',
        'participante',
        117,
        4,
        '2023-02-15',
        'coordenador',
        91,
        4,
        '2023-03-01',
        'participante',
      ],
    );

    for (const publicacao of publicacoesAcervo) {
      await pool.query(
        `
          INSERT INTO publicacao (id_publicacao, id_projeto, tipo, ano, doi, veiculo, titulo)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        publicacao,
      );
    }

    await pool.query(
      `
        INSERT INTO autoria (id_pesquisador, id_publicacao, ordem)
        VALUES
          ($1, $2, $3),
          ($4, $5, $6),
          ($7, $8, $9),
          ($10, $11, $12),
          ($13, $14, $15),
          ($16, $17, $18)
      `,
      [91, 1, 1, 104, 1, 2, 104, 2, 1, 117, 2, 2, 91, 2, 3, 117, 3, 1],
    );
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
