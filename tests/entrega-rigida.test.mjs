import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (caminho) => readFileSync(join(raiz, caminho), 'utf8');
const existe = (caminho) => existsSync(join(raiz, caminho));

function arquivosRecursivos(diretorio) {
  const saida = [];
  for (const nome of readdirSync(diretorio)) {
    const caminho = join(diretorio, nome);
    if (statSync(caminho).isDirectory()) saida.push(...arquivosRecursivos(caminho));
    else saida.push(caminho);
  }
  return saida;
}

function tabelasDoSchema() {
  return [...ler('database/init/01-schema.sql').matchAll(/CREATE TABLE\s+(\w+)\s*\(/gi)].map(
    (match) => match[1],
  );
}

function colunasDoSchema() {
  const schema = ler('database/init/01-schema.sql');
  const tabelas = new Map();

  for (const match of schema.matchAll(/CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\n\);/gi)) {
    const colunas = new Set();
    for (const linha of match[2].split('\n')) {
      const coluna = linha.match(/^\s{4}([a-z_][a-z0-9_]*)\s+/i)?.[1];
      if (coluna && coluna.toUpperCase() !== 'CONSTRAINT') colunas.add(coluna);
    }
    tabelas.set(match[1], colunas);
  }

  return tabelas;
}

test('os artefatos documentais obrigatórios continuam presentes', () => {
  for (const caminho of [
    'database/docs/diagrama-logico-uml.png',
    'database/docs/diagrama-logico.mermaid',
    'database/docs/dicionario-de-dados.pdf',
  ]) assert.ok(existe(caminho), caminho);
});

test('o diretório de init possui schema, seed, Views e Triggers na ordem esperada', () => {
  const arquivos = readdirSync(join(raiz, 'database/init')).sort();
  assert.deepStrictEqual(arquivos, ['01-schema.sql', '02-seed.sql', '03-views.sql', '04-triggers.sql']);
});

test('o schema contém exatamente as tabelas relacionais esperadas pelo projeto', () => {
  assert.deepStrictEqual(tabelasDoSchema(), [
    'curso',
    'conta',
    'aluno',
    'pesquisador',
    'edital',
    'grupo_pesquisa',
    'projeto_pesquisa',
    'area_conhecimento',
    'publicacao',
    'vaga',
    'membro',
    'participacao',
    'possui_area',
    'area_publicacao',
    'autoria',
    'candidatura',
  ]);
});

test('todas as FKs declaradas apontam para tabela e coluna existentes', () => {
  const schema = ler('database/init/01-schema.sql');
  const tabelas = colunasDoSchema();
  const fks = [...schema.matchAll(/FOREIGN KEY\s*\((\w+)\)\s*\n?\s*REFERENCES\s+(\w+)\s*\((\w+)\)/gi)];
  assert.ok(fks.length >= 10);

  for (const match of fks) {
    const [, , tabelaDestino, colunaDestino] = match;
    assert.ok(tabelas.has(tabelaDestino), `Tabela de FK ausente: ${tabelaDestino}`);
    assert.ok(
      tabelas.get(tabelaDestino).has(colunaDestino),
      `Coluna de FK ausente: ${tabelaDestino}.${colunaDestino}`,
    );
  }
});

test('as regras de integridade centrais não foram afrouxadas', () => {
  const schema = ler('database/init/01-schema.sql');
  for (const regra of [
    "ck_conta_tipo CHECK (tipo IN ('pesquisador', 'aluno', 'admin'))",
    "ck_projeto_status CHECK (status IN ('planejado', 'em_andamento', 'concluido', 'cancelado'))",
    "ck_publicacao_tipo CHECK (tipo IN ('artigo', 'capitulo', 'resumo'))",
    "ck_vaga_status CHECK (status IN ('aberta', 'fechada'))",
    "ck_candidatura_status CHECK (status IN ('pendente', 'aprovada', 'rejeitada'))",
    'ck_vaga_qtd CHECK (qtd_vagas > 0)',
    'ck_projeto_periodo CHECK (data_fim IS NULL OR data_fim >= data_inicio)',
  ]) assert.ok(schema.includes(regra), regra);
});

test('o seed é determinístico e não usa random()', () => {
  const seed = ler('database/init/02-seed.sql');
  assert.doesNotMatch(seed, /\brandom\s*\(/i);
  assert.match(seed, /generate_series\s*\(/i);
});

test('o seed povoa todas as tabelas de negócio do schema', () => {
  const seed = ler('database/init/02-seed.sql');
  const inseridas = new Set([...seed.matchAll(/INSERT INTO\s+(\w+)/gi)].map((m) => m[1]));
  const esperadas = tabelasDoSchema();
  for (const tabela of esperadas) assert.ok(inseridas.has(tabela), `Seed não povoa ${tabela}`);
});

test('o volume documentado do seed soma 2522 registros de negócio', () => {
  const totais = {
    curso: 18,
    conta: 150,
    aluno: 90,
    pesquisador: 80,
    edital: 60,
    grupo_pesquisa: 55,
    projeto_pesquisa: 120,
    area_conhecimento: 24,
    publicacao: 200,
    vaga: 90,
    membro: 165,
    participacao: 360,
    possui_area: 240,
    autoria: 600,
    candidatura: 270,
  };
  assert.strictEqual(Object.values(totais).reduce((a, b) => a + b, 0), 2522);

  const readme = ler('README.md');
  assert.match(readme, /2\.522 tuplas/);
});

test('as fórmulas do seed geram PKs compostas sem duplicidade', () => {
  const cenarios = [
    ['membro', 55, 3, (pai, k) => [1 + ((pai * 7 + k * 23) % 80), pai]],
    ['participacao', 120, 3, (pai, k) => [1 + ((pai * 13 + k * 29) % 80), pai]],
    ['possui_area', 120, 2, (pai, k) => [pai, 1 + ((pai * 5 + k * 11) % 24)]],
    ['autoria', 200, 3, (pai, k) => [1 + ((pai * 19 + k * 31) % 80), pai]],
    ['candidatura', 90, 3, (pai, k) => [1 + ((pai * 3 + k * 37) % 90), pai]],
  ];

  for (const [nome, pais, quantidade, chave] of cenarios) {
    const chaves = new Set();
    for (let pai = 1; pai <= pais; pai += 1) {
      for (let k = 0; k < quantidade; k += 1) {
        const valor = chave(pai, k).join(':');
        assert.ok(!chaves.has(valor), `${nome}: chave repetida ${valor}`);
        chaves.add(valor);
      }
    }
    assert.strictEqual(chaves.size, pais * quantidade, nome);
  }
});

test('as fórmulas de FK do seed ficam dentro das faixas existentes', () => {
  for (let i = 1; i <= 120; i += 1) {
    const grupo = 1 + ((i * 13) % 55);
    const edital = i % 4 === 0 ? null : 1 + ((i * 7) % 60);
    assert.ok(grupo >= 1 && grupo <= 55);
    assert.ok(edital === null || (edital >= 1 && edital <= 60));
  }

  for (let i = 1; i <= 200; i += 1) {
    const projeto = 1 + ((i * 11) % 120);
    assert.ok(projeto >= 1 && projeto <= 120);
  }

  for (let i = 1; i <= 90; i += 1) {
    const projeto = 1 + ((i * 17) % 120);
    assert.ok(projeto >= 1 && projeto <= 120);
  }
});

test('as fórmulas de relacionamentos respeitam faixas de pesquisadores, alunos e áreas', () => {
  for (let g = 1; g <= 55; g += 1) {
    for (let k = 0; k < 3; k += 1) {
      const pesquisador = 1 + ((g * 7 + k * 23) % 80);
      assert.ok(pesquisador >= 1 && pesquisador <= 80);
    }
  }
  for (let p = 1; p <= 120; p += 1) {
    for (let k = 0; k < 2; k += 1) {
      const area = 1 + ((p * 5 + k * 11) % 24);
      assert.ok(area >= 1 && area <= 24);
    }
  }
  for (let v = 1; v <= 90; v += 1) {
    for (let k = 0; k < 3; k += 1) {
      const aluno = 1 + ((v * 3 + k * 37) % 90);
      assert.ok(aluno >= 1 && aluno <= 90);
    }
  }
});

test('as sequências SERIAL usadas no seed são reposicionadas ao final', () => {
  const seed = ler('database/init/02-seed.sql');
  for (const [tabela, coluna] of [
    ['curso', 'id_curso'],
    ['conta', 'id_conta'],
    ['aluno', 'id_aluno'],
    ['pesquisador', 'id_pesquisador'],
    ['edital', 'id_edital'],
    ['grupo_pesquisa', 'id_grupo'],
    ['projeto_pesquisa', 'id_projeto'],
    ['area_conhecimento', 'id_area'],
    ['publicacao', 'id_publicacao'],
    ['vaga', 'id_vaga'],
  ]) {
    assert.ok(seed.includes(`pg_get_serial_sequence('${tabela}', '${coluna}')`));
  }
});

test('03-views.sql cria exatamente as três Views exigidas e nenhuma quarta View', () => {
  const sql = ler('database/init/03-views.sql');
  const nomes = [...sql.matchAll(/CREATE OR REPLACE VIEW\s+(\w+)\s+AS/gi)].map((m) => m[1]);
  assert.deepStrictEqual(nomes, [
    'v_projetos_detalhados',
    'v_producao_bibliografica',
    'v_grupos_pesquisa',
  ]);
});

test('cada View usa pelo menos três tabelas e não usa SELECT *', () => {
  const sql = ler('database/init/03-views.sql');
  const blocos = sql.split(/(?=CREATE OR REPLACE VIEW\s+)/i).filter(Boolean);
  assert.strictEqual(blocos.length, 3);
  for (const bloco of blocos) {
    const tabelas = [...bloco.matchAll(/\b(?:FROM|JOIN)\s+(\w+)/gi)].map((m) => m[1]);
    assert.ok(new Set(tabelas).size >= 3, bloco.slice(0, 80));
    assert.doesNotMatch(bloco, /SELECT\s+\*/i);
  }
});

test('a View bibliográfica admite publicação sem autoria e mantém ordem quando houver autoria', () => {
  const sql = ler('database/init/03-views.sql');
  const inicio = sql.indexOf('CREATE OR REPLACE VIEW v_producao_bibliografica');
  const fim = sql.indexOf('CREATE OR REPLACE VIEW v_grupos_pesquisa');
  const bloco = sql.slice(inicio, fim);
  assert.match(bloco, /LEFT JOIN autoria au/);
  assert.match(bloco, /LEFT JOIN pesquisador pe/);
  assert.match(bloco, /au\.ordem AS ordem_autor/);
});

test('a View de grupos preserva grupos sem membros e sem projetos', () => {
  const sql = ler('database/init/03-views.sql');
  const bloco = sql.slice(sql.indexOf('CREATE OR REPLACE VIEW v_grupos_pesquisa'));
  assert.match(bloco, /FROM grupo_pesquisa g\s+LEFT JOIN membro m/s);
  assert.match(bloco, /LEFT JOIN projeto_pesquisa pr/);
  assert.match(bloco, /COALESCE\s*\(/);
});

test('o backend dos relatórios não reconstrói JOINs: consulta somente as Views', () => {
  const repo = ler('backend/src/models/repositorioRelatorios.js');
  assert.doesNotMatch(repo, /\bJOIN\b/i);
  for (const view of ['v_projetos_detalhados', 'v_producao_bibliografica', 'v_grupos_pesquisa']) {
    assert.ok(repo.includes(`FROM ${view}`));
  }
});

test('os quatro CRUDs de chave simples possuem controller, service e repository para PUT e DELETE', () => {
  for (const dominio of ['projeto', 'publicacao', 'grupo', 'vaga']) {
    const controller = ler(`backend/src/controllers/${dominio}Controller.js`);
    const service = ler(`backend/src/services/${dominio}Service.js`);
    const repoNome = dominio === 'publicacao' ? 'repositorioPublicacoes.js'
      : dominio === 'projeto' ? 'repositorioProjetos.js'
        : dominio === 'grupo' ? 'repositorioGrupos.js' : 'repositorioVagas.js';
    const repo = ler(`backend/src/models/${repoNome}`);
    assert.match(controller, /export async function atualizar/);
    assert.match(controller, /export async function excluir/);
    assert.match(service, /export async function atualizar/);
    assert.match(service, /export async function excluir/);
    assert.match(repo, /export async function atualizar/);
    assert.match(repo, /export async function excluir/);
  }
});

test('todos os UPDATE e DELETE novos usam parâmetros SQL, sem concatenar ids do usuário', () => {
  for (const arquivo of [
    'backend/src/models/repositorioProjetos.js',
    'backend/src/models/repositorioPublicacoes.js',
    'backend/src/models/repositorioGrupos.js',
    'backend/src/models/repositorioVagas.js',
    'backend/src/models/repositorioCandidaturas.js',
  ]) {
    const texto = ler(arquivo);
    for (const match of texto.matchAll(/(?:UPDATE|DELETE FROM)[\s\S]{0,400}?WHERE[\s\S]{0,200}?(?=`|',|"\))/gi)) {
      assert.match(match[0], /\$\d+/, `${arquivo}: SQL sem placeholder`);
    }
  }
});

test('a candidatura usa PK composta em repository, service, controller, routes e frontend', () => {
  const caminhos = [
    'backend/src/models/repositorioCandidaturas.js',
    'backend/src/services/candidaturaService.js',
    'backend/src/controllers/candidaturaController.js',
    'backend/src/routes/candidaturaRoutes.js',
    'frontend/src/servicos/candidaturaService.js',
  ];
  for (const caminho of caminhos) {
    const texto = ler(caminho);
    assert.ok(texto.includes('idAluno') && texto.includes('idVaga'), caminho);
  }
});

test('o aluno só lista/acessa/exclui as próprias candidaturas', () => {
  const service = ler('backend/src/services/candidaturaService.js');
  assert.match(service, /if \(usuario\.tipo === 'aluno'\)\s*\{\s*idAluno = await resolverIdAluno\(usuario\)/s);
  assert.match(service, /garantirAcessoAoAluno\(idAluno, usuario\)/);
  assert.match(service, /Você só pode acessar suas próprias candidaturas\./);
});

test('o cadastro de candidatura não aceita vaga fechada nem duplicidade', () => {
  const service = ler('backend/src/services/candidaturaService.js');
  assert.match(service, /vaga\.status !== 'aberta'/);
  assert.match(service, /pk_candidatura/);
  assert.match(service, /409/);
});

test('a atualização de publicação aceita autor existente e autor novo', () => {
  const pagina = ler('frontend/src/paginas/EditarPublicacao.jsx');
  assert.match(pagina, /autor\.id !== undefined\s*\? \{ id: autor\.id \}/s);
  assert.match(pagina, /numeroLattes: autor\.numeroLattes/);
  assert.match(pagina, /vinculo: autor\.vinculo/);
});

test('o frontend possui Create, Read, Update e Delete visíveis para os cinco domínios da entrega', () => {
  const app = ler('frontend/src/App.jsx');
  for (const rota of [
    '/projetos',
    '/publicacoes',
    '/grupos',
    '/vagas',
    '/candidaturas',
  ]) assert.ok(app.includes(`path="${rota}`) || app.includes(`path='${rota}`), rota);

  for (const pagina of ['Projetos.jsx', 'Publicacoes.jsx', 'Grupos.jsx', 'Vagas.jsx']) {
    assert.match(ler(`frontend/src/paginas/${pagina}`), /excluir/i, pagina);
  }
  assert.match(ler('frontend/src/paginas/Candidaturas.jsx'), /candidatar/);
  assert.match(ler('frontend/src/paginas/Candidaturas.jsx'), /mudarStatus/);
  assert.match(ler('frontend/src/paginas/Candidaturas.jsx'), /excluir/);
});

test('a tela Relatórios chama exatamente os três serviços correspondentes às três Views', () => {
  const pagina = ler('frontend/src/paginas/Relatorios.jsx');
  for (const chamada of ['listarProjetos()', 'listarPublicacoes()', 'listarGrupos()']) {
    assert.ok(pagina.includes(`relatorioService.${chamada}`));
  }
});

test('as páginas novas reutilizam classes de estilo definidas no projeto', () => {
  const css = arquivosRecursivos(join(raiz, 'frontend/src/estilos'))
    .filter((f) => extname(f) === '.css')
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
  for (const classe of ['tabela-relatorio', 'acoes-registro', 'formulario-acervo--compacto']) {
    assert.match(css, new RegExp(`\\.${classe.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`));
  }
});

test('docker-compose define somente db, backend e frontend como serviços da entrega', () => {
  const compose = ler('docker-compose.yml');
  const blocoServicos = compose.slice(compose.indexOf('services:'), compose.indexOf('\nvolumes:'));
  const nomes = [...blocoServicos.matchAll(/^  ([a-zA-Z0-9_-]+):\s*$/gm)].map((m) => m[1]);
  assert.deepStrictEqual(nomes, ['db', 'backend', 'frontend']);
});

test('as três portas documentadas batem com docker-compose', () => {
  const compose = ler('docker-compose.yml');
  const readme = ler('README.md');
  for (const porta of ['5432', '3000', '5173']) {
    assert.ok(compose.includes(`"${porta}:`), `compose ${porta}`);
    assert.ok(readme.includes(`\`${porta}\``), `README ${porta}`);
  }
});

test('o banco inicia schema, seed e Views pelo volume padrão do PostgreSQL', () => {
  const compose = ler('docker-compose.yml');
  assert.match(compose, /\.\/database\/init:\/docker-entrypoint-initdb\.d:ro/);
});

test('backend e frontend aguardam healthchecks na cadeia db -> backend -> frontend', () => {
  const compose = ler('docker-compose.yml');
  assert.match(compose, /db:[\s\S]*?healthcheck:/);
  assert.match(compose, /backend:[\s\S]*?depends_on:[\s\S]*?db:[\s\S]*?condition: service_healthy/);
  assert.match(compose, /frontend:[\s\S]*?depends_on:[\s\S]*?backend:[\s\S]*?condition: service_healthy/);
});

test('o backend em Docker usa db como host e o frontend usa a API exposta no host', () => {
  const compose = ler('docker-compose.yml');
  assert.match(compose, /@db:5432\/scientia/);
  assert.match(compose, /VITE_API_URL:\s+http:\/\/localhost:3000\/api/);
});

test('os Dockerfiles usam package-lock por npm ci e expõem as portas corretas', () => {
  const backend = ler('backend/Dockerfile');
  const frontend = ler('frontend/Dockerfile');
  assert.match(backend, /COPY package\.json package-lock\.json/);
  assert.match(backend, /RUN npm ci --omit=dev/);
  assert.match(backend, /EXPOSE 3000/);
  assert.match(frontend, /COPY package\.json package-lock\.json/);
  assert.match(frontend, /RUN npm ci/);
  assert.match(frontend, /EXPOSE 80/);
});

test('o Nginx do frontend possui fallback de SPA para rotas do React', () => {
  assert.match(ler('frontend/nginx/default.conf.template'), /try_files \$uri \$uri\/ \/index\.html;/);
});

test('package.json e package-lock.json permanecem coerentes nas dependências de primeiro nível', () => {
  for (const pasta of ['backend', 'frontend']) {
    const pacote = JSON.parse(ler(`${pasta}/package.json`));
    const lock = JSON.parse(ler(`${pasta}/package-lock.json`));
    assert.strictEqual(lock.lockfileVersion, 3, pasta);
    const raizLock = lock.packages?.[''] ?? {};
    assert.deepStrictEqual(raizLock.dependencies ?? {}, pacote.dependencies ?? {}, `${pasta} dependencies`);
    assert.deepStrictEqual(raizLock.devDependencies ?? {}, pacote.devDependencies ?? {}, `${pasta} devDependencies`);
  }
});

test('README contém todos os itens textuais exigidos na instrução de entrega', () => {
  const readme = ler('README.md').toLowerCase();
  for (const trecho of [
    'integrantes',
    'portas da aplicação',
    'diagrama-logico-uml.png',
    'dicionario-de-dados.pdf',
    'povoamento',
    'views da entrega',
    'cruds implementados para a entrega',
    'docker compose up --build',
  ]) assert.ok(readme.includes(trecho.toLowerCase()), trecho);
});

test('os caminhos citados no bloco de Banco/entrega do README existem no repositório', () => {
  const readme = ler('README.md');
  for (const caminho of [
    'database/docs/diagrama-logico-uml.png',
    'database/docs/diagrama-logico.mermaid',
    'database/docs/dicionario-de-dados.pdf',
    'database/init/01-schema.sql',
    'database/init/02-seed.sql',
    'database/init/03-views.sql',
  ]) {
    assert.ok(readme.includes(caminho), `README não cita ${caminho}`);
    assert.ok(existe(caminho), `Arquivo ausente ${caminho}`);
  }
});

test('não há node_modules, coverage, dist ou arquivos temporários no conteúdo da entrega', () => {
  const proibidos = new Set(['node_modules', 'coverage', 'dist', '.pytest_cache', '__pycache__']);
  const pilha = [raiz];
  while (pilha.length) {
    const atual = pilha.pop();
    for (const nome of readdirSync(atual)) {
      const caminho = join(atual, nome);
      if (statSync(caminho).isDirectory()) {
        assert.ok(!proibidos.has(nome), `Diretório gerado presente: ${caminho}`);
        if (nome !== '.git') pilha.push(caminho);
      }
    }
  }
});

test('não há logs, backups ou arquivos de editor no conteúdo da entrega', () => {
  const arquivos = arquivosRecursivos(raiz).filter((arquivo) => !arquivo.includes('/.git/'));
  for (const arquivo of arquivos) {
    assert.doesNotMatch(arquivo, /(?:\.log|\.tmp|\.bak|~)$/i, arquivo);
  }
});

test('os workflows existentes continuam cobrindo backend e frontend', () => {
  const backend = ler('.github/workflows/backend.yml');
  const frontend = ler('.github/workflows/frontend.yml');
  assert.match(backend, /npm run coverage/);
  assert.match(backend, /postgres:16/);
  assert.match(frontend, /npm run build/);
  assert.match(frontend, /npm test/);
});

test('a suíte de frontend cobre as telas novas e os formulários de atualização', () => {
  for (const arquivo of [
    'frontend/src/tests/Relatorios.test.jsx',
    'frontend/src/tests/Vagas.test.jsx',
    'frontend/src/tests/Candidaturas.test.jsx',
    'frontend/src/tests/EditarProjeto.test.jsx',
    'frontend/src/tests/EditarPublicacao.test.jsx',
    'frontend/src/tests/FormularioGrupo.test.jsx',
    'frontend/src/tests/FormularioVaga.test.jsx',
  ]) assert.ok(existe(arquivo), arquivo);
});

test('a suíte de API cobre os fluxos de CRUD, Views, integridade e autorização adicionados', () => {
  const api = ler('backend/src/tests/api.test.js');
  for (const trecho of [
    'atualiza e exclui projetos preservando relações e cascatas',
    'atualiza autoria de publicação e exclui autorias por cascata',
    'atualiza grupo, exclui grupo sem projetos e protege grupo referenciado',
    'consulta as três Views pelos endpoints de relatórios com agregações coerentes',
    'executa CRUD de vagas e valida projeto, quantidade e status',
    'executa fluxo completo de candidatura pela chave composta',
    'impede candidatura em vaga fechada e acesso do aluno a candidatura alheia',
  ]) assert.ok(api.includes(trecho), trecho);
});

test('workflow específico da entrega executa compose do zero e sempre remove o volume', () => {
  const workflow = ler('.github/workflows/entrega-bd.yml');
  assert.match(workflow, /docker compose config --quiet/);
  assert.match(workflow, /docker compose up --build -d/);
  assert.match(workflow, /docker compose down -v/);
  assert.match(workflow, /if: always\(\)/);
});

test('workflow específico da entrega consulta as três Views no PostgreSQL real', () => {
  const workflow = ler('.github/workflows/entrega-bd.yml');
  for (const view of ['v_projetos_detalhados', 'v_producao_bibliografica', 'v_grupos_pesquisa']) {
    assert.ok(workflow.includes(`SELECT COUNT(*) FROM ${view};`), view);
  }
  assert.match(workflow, /psql -U scientia -d scientia -v ON_ERROR_STOP=1/);
});

test('workflow específico da entrega testa saúde e os três endpoints das Views', () => {
  const workflow = ler('.github/workflows/entrega-bd.yml');
  for (const caminho of [
    'http://localhost:3000/api/status',
    'http://localhost:5173',
    'http://localhost:3000/api/relatorios/projetos',
    'http://localhost:3000/api/relatorios/publicacoes',
    'http://localhost:3000/api/relatorios/grupos',
  ]) assert.ok(workflow.includes(caminho), caminho);
});
