import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { validarProjeto } from '../frontend/src/utils/validacaoProjeto.js';
import { validarPublicacao } from '../frontend/src/utils/validacaoPublicacao.js';
import {
  formatarData,
  nomesDosAutores,
  podeCadastrarNoAcervo,
  totalDePaginas,
} from '../frontend/src/utils/acervo.js';
import {
  validarEnumOpcional,
  validarId,
  validarInteiroOpcional,
  validarPaginacao,
} from '../backend/src/services/consultaParametrosService.js';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (caminho) => readFileSync(join(raiz, caminho), 'utf8');

function arquivosRecursivos(diretorio) {
  const resultado = [];
  for (const nome of readdirSync(diretorio)) {
    const caminho = join(diretorio, nome);
    if (statSync(caminho).isDirectory()) resultado.push(...arquivosRecursivos(caminho));
    else resultado.push(caminho);
  }
  return resultado;
}

function blocoView(nome) {
  const sql = ler('database/init/03-views.sql');
  const inicio = sql.indexOf(`CREATE OR REPLACE VIEW ${nome} AS`);
  assert.notEqual(inicio, -1, `View ${nome} ausente`);
  const proxima = sql.indexOf('CREATE OR REPLACE VIEW ', inicio + 1);
  return sql.slice(inicio, proxima === -1 ? sql.length : proxima);
}

test('arquivos obrigatórios da entrega existem', () => {
  for (const arquivo of [
    'database/init/01-schema.sql',
    'database/init/02-seed.sql',
    'database/init/03-views.sql',
    'backend/Dockerfile',
    'frontend/Dockerfile',
    'docker-compose.yml',
    'README.md',
  ]) assert.ok(existsSync(join(raiz, arquivo)), arquivo);
});

test('schema preserva PKs, FKs e constraints centrais', () => {
  const sql = ler('database/init/01-schema.sql');
  for (const trecho of [
    'CONSTRAINT pk_candidatura PRIMARY KEY (id_aluno, id_vaga)',
    'CONSTRAINT fk_vaga_projeto FOREIGN KEY (id_projeto)',
    'CONSTRAINT fk_publicacao_projeto FOREIGN KEY (id_projeto)',
    'CONSTRAINT fk_projeto_grupo FOREIGN KEY (id_grupo)',
    "CONSTRAINT ck_projeto_status CHECK (status IN ('planejado', 'em_andamento', 'concluido', 'cancelado'))",
  ]) assert.match(sql, new RegExp(trecho.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

for (const [nome, tabelas] of [
  ['v_projetos_detalhados', ['projeto_pesquisa', 'grupo_pesquisa', 'edital', 'publicacao']],
  ['v_producao_bibliografica', ['publicacao', 'projeto_pesquisa', 'autoria', 'pesquisador']],
  ['v_grupos_pesquisa', ['grupo_pesquisa', 'membro', 'pesquisador', 'projeto_pesquisa']],
]) {
  test(`${nome} é não trivial e usa as tabelas esperadas`, () => {
    const bloco = blocoView(nome);
    assert.doesNotMatch(bloco, /SELECT\s+\*/i);
    for (const tabela of tabelas) assert.match(bloco, new RegExp(`\\b${tabela}\\b`));
    assert.match(bloco, /JOIN/i);
  });
}

test('View de projetos agrega publicações', () => {
  const bloco = blocoView('v_projetos_detalhados');
  assert.match(bloco, /COUNT\s*\(\s*DISTINCT\s+pu\.id_publicacao\s*\)/i);
});

test('View bibliográfica mantém ordem de autoria', () => {
  const bloco = blocoView('v_producao_bibliografica');
  assert.match(bloco, /au\.ordem\s+AS\s+ordem_autor/i);
});

test('View de grupos evita inflação de contagens por JOIN', () => {
  const bloco = blocoView('v_grupos_pesquisa');
  assert.match(bloco, /COUNT\s*\(\s*DISTINCT\s+m\.id_pesquisador/i);
  assert.match(bloco, /COUNT\s*\(\s*DISTINCT\s+pr\.id_projeto/i);
});

test('docker compose contém db, backend e frontend', () => {
  const compose = ler('docker-compose.yml');
  assert.match(compose, /^\s{2}db:/m);
  assert.match(compose, /^\s{2}backend:/m);
  assert.match(compose, /^\s{2}frontend:/m);
  assert.match(compose, /postgres:\/\/scientia:scientia@db:5432\/scientia/);
  assert.match(compose, /VITE_API_URL:\s+http:\/\/localhost:3000\/api/);
  assert.match(compose, /\.\/database\/init:\/docker-entrypoint-initdb\.d:ro/);
});

test('app registra vagas, candidaturas e relatórios', () => {
  const app = ler('backend/src/app.js');
  for (const rota of ['/api/vagas', '/api/candidaturas', '/api/relatorios']) assert.ok(app.includes(rota));
});

for (const [arquivo, prefixo] of [
  ['backend/src/routes/projetoRoutes.js', 'projetoController'],
  ['backend/src/routes/publicacaoRoutes.js', 'publicacaoController'],
  ['backend/src/routes/grupoRoutes.js', 'grupoController'],
  ['backend/src/routes/vagaRoutes.js', 'vagaController'],
]) {
  test(`${arquivo} expõe CRUD completo`, () => {
    const texto = ler(arquivo);
    assert.match(texto, /rotas\.get\('\/'/);
    assert.match(texto, /rotas\.post\('\/'/);
    assert.match(texto, /rotas\.put\('\/:id'/);
    assert.match(texto, /rotas\.delete\('\/:id'/);
    assert.ok(texto.includes(prefixo));
  });
}

test('candidaturas usam chave composta nas rotas', () => {
  const texto = ler('backend/src/routes/candidaturaRoutes.js');
  assert.match(texto, /get\('\/:idAluno\/:idVaga'/);
  assert.match(texto, /put\('\/:idAluno\/:idVaga'/);
  assert.match(texto, /delete\('\/:idAluno\/:idVaga'/);
});

test('backend consulta as Views diretamente', () => {
  const repo = ler('backend/src/models/repositorioRelatorios.js');
  for (const nome of ['v_projetos_detalhados', 'v_producao_bibliografica', 'v_grupos_pesquisa']) assert.ok(repo.includes(`FROM ${nome}`));
});

test('frontend possui tela única para as três Views', () => {
  const pagina = ler('frontend/src/paginas/Relatorios.jsx');
  for (const texto of ['Projetos detalhados', 'Produção bibliográfica', 'Grupos de pesquisa']) assert.ok(pagina.includes(texto));
  const app = ler('frontend/src/App.jsx');
  assert.ok(app.includes('path="/relatorios"'));
});

test('frontend expõe CRUD visual para projetos, publicações e grupos', () => {
  assert.ok(ler('frontend/src/paginas/Projetos.jsx').includes('/projetos/${projeto.id}/editar'));
  assert.ok(ler('frontend/src/paginas/Publicacoes.jsx').includes('/publicacoes/${publicacao.id}/editar'));
  assert.ok(ler('frontend/src/paginas/Grupos.jsx').includes('/grupos/${grupo.id}/editar'));
  assert.ok(ler('frontend/src/paginas/EditarProjeto.jsx').includes('projetoService.atualizar'));
  assert.ok(ler('frontend/src/paginas/EditarPublicacao.jsx').includes('publicacaoService.atualizar'));
  assert.ok(ler('frontend/src/paginas/FormularioGrupo.jsx').includes('grupoService.atualizar'));
});

test('frontend possui telas de vagas e candidaturas', () => {
  const app = ler('frontend/src/App.jsx');
  assert.ok(app.includes('path="/vagas"'));
  assert.ok(app.includes('path="/candidaturas"'));
  assert.ok(ler('frontend/src/paginas/Vagas.jsx').includes('vagaService.excluir'));
  assert.ok(ler('frontend/src/paginas/Candidaturas.jsx').includes('candidaturaService.atualizar'));
});

test('rotas públicas incluem leitura das Views e vagas, mas não candidaturas', () => {
  const seguranca = ler('backend/src/config/seguranca.js');
  assert.ok(seguranca.includes("'/api/relatorios/projetos'"));
  assert.ok(seguranca.includes("'/api/vagas/:id'"));
  assert.ok(!seguranca.includes("'/api/candidaturas'"));
});

test('todos os imports relativos JS/JSX apontam para arquivos existentes', () => {
  const arquivos = [
    ...arquivosRecursivos(join(raiz, 'backend/src')),
    ...arquivosRecursivos(join(raiz, 'frontend/src')),
  ].filter((arquivo) => ['.js', '.jsx'].includes(extname(arquivo)));
  const regex = /from\s+['"](\.[^'"]+)['"]/g;
  for (const arquivo of arquivos) {
    const texto = readFileSync(arquivo, 'utf8');
    for (const match of texto.matchAll(regex)) {
      assert.ok(existsSync(resolve(dirname(arquivo), match[1])), `${arquivo}: ${match[1]}`);
    }
  }
});

test('todos os arquivos JS do backend passam no parser do Node', () => {
  const arquivos = arquivosRecursivos(join(raiz, 'backend/src')).filter((arquivo) => extname(arquivo) === '.js');
  for (const arquivo of arquivos) execFileSync(process.execPath, ['--check', arquivo], { stdio: 'pipe' });
});

test('README documenta portas, povoamento, Views e Docker', () => {
  const readme = ler('README.md');
  for (const trecho of ['Portas da aplicação', 'Povoamento', 'v_projetos_detalhados', 'v_producao_bibliografica', 'v_grupos_pesquisa', 'docker compose up --build']) {
    assert.match(readme.toLowerCase(), new RegExp(trecho.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});


test('nenhum arquivo-fonte contém marcador de conflito de merge', () => {
  const arquivos = arquivosRecursivos(raiz).filter(
    (arquivo) => !arquivo.includes('/node_modules/') && !arquivo.endsWith('.zip'),
  );

  for (const arquivo of arquivos) {
    const extensao = extname(arquivo);
    if (!['.js', '.jsx', '.sql', '.md', '.yml', '.yaml', '.json', '.sh'].includes(extensao)) {
      continue;
    }
    const texto = readFileSync(arquivo, 'utf8');
    assert.doesNotMatch(texto, /^<<<<<<< |^=======\s*$|^>>>>>>> /m, arquivo);
  }
});

test('as referências alias.coluna das Views existem no schema', () => {
  const schema = ler('database/init/01-schema.sql');
  const tabelas = new Map();

  for (const match of schema.matchAll(/CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\n\);/gi)) {
    const colunas = new Set();
    for (const linha of match[2].split('\n')) {
      const coluna = linha.match(/^\s{4}([a-z_][a-z0-9_]*)\s+/i)?.[1];
      if (coluna && coluna.toUpperCase() !== 'CONSTRAINT') {
        colunas.add(coluna);
      }
    }
    tabelas.set(match[1], colunas);
  }

  for (const nome of ['v_projetos_detalhados', 'v_producao_bibliografica', 'v_grupos_pesquisa']) {
    const bloco = blocoView(nome);
    const aliases = new Map();
    for (const match of bloco.matchAll(/\b(?:FROM|JOIN)\s+(\w+)\s+(\w+)/gi)) {
      aliases.set(match[2], match[1]);
    }

    for (const match of bloco.matchAll(/\b([a-z][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\b/gi)) {
      const [alias, coluna] = [match[1], match[2]];
      const tabela = aliases.get(alias);
      assert.ok(tabela, `${nome}: alias ${alias} não foi declarado`);
      assert.ok(tabelas.get(tabela)?.has(coluna), `${nome}: coluna ${tabela}.${coluna} não existe`);
    }
  }
});

test('setup do banco de teste cria as Views após o schema', () => {
  const setup = ler('backend/src/tests/setupBancoTeste.js');
  assert.ok(setup.includes("caminhoViews = resolve(__dirname, '../../../database/init/03-views.sql')"));
  assert.match(setup, /await aplicarSchemaSeNecessario\(\);\s*await aplicarViews\(\);/);
});

test('serviço de candidatura resolve aluno pelo subject do JWT', () => {
  const service = ler('backend/src/services/candidaturaService.js');
  assert.match(service, /buscarAlunoPorConta\(Number\(usuario\.sub\)\)/);
  assert.doesNotMatch(service, /buscarAlunoPorConta\(usuario\.id\)/);
});

test('candidatura bloqueia vaga fechada e trata duplicidade da chave composta', () => {
  const service = ler('backend/src/services/candidaturaService.js');
  assert.ok(service.includes("vaga.status !== 'aberta'"));
  assert.ok(service.includes("erro.constraint === 'pk_candidatura'"));
  assert.ok(service.includes('Você já possui candidatura para essa vaga.'));
});

test('autorização de candidaturas separa criação, atualização e exclusão', () => {
  const rotas = ler('backend/src/routes/candidaturaRoutes.js');
  assert.match(rotas, /post\('\/', exigeTipo\('aluno', 'admin'\)/);
  assert.match(rotas, /put\('\/:idAluno\/:idVaga', exigeTipo\('pesquisador', 'admin'\)/);
  assert.match(rotas, /delete\('\/:idAluno\/:idVaga', exigeTipo\('aluno', 'admin'\)/);
});

test('serviço de vagas valida projeto, quantidade, status e data', () => {
  const service = ler('backend/src/services/vagaService.js');
  assert.ok(service.includes("const STATUS_VAGA = ['aberta', 'fechada']"));
  assert.ok(service.includes('A quantidade de vagas deve ser um número inteiro maior que zero.'));
  assert.ok(service.includes('Informe um projeto válido.'));
  assert.ok(service.includes('Informe a data de abertura no formato YYYY-MM-DD.'));
  assert.match(service, /repositorioProjetos\.existe\(vaga\.idProjeto, cliente\)/);
});

test('Dockerfiles usam npm ci e frontend entrega SPA com fallback do nginx', () => {
  const backend = ler('backend/Dockerfile');
  const frontend = ler('frontend/Dockerfile');
  const nginx = ler('frontend/nginx/default.conf.template');
  assert.ok(backend.includes('RUN npm ci --omit=dev'));
  assert.ok(backend.includes('USER node'));
  assert.ok(frontend.includes('RUN npm ci'));
  assert.ok(frontend.includes('FROM nginx:alpine'));
  assert.ok(nginx.includes('try_files $uri $uri/ /index.html;'));
});

test('docker compose espera saúde do banco e do backend', () => {
  const compose = ler('docker-compose.yml');
  assert.match(compose, /db:\s*[\s\S]*healthcheck:/);
  assert.match(compose, /backend:\s*[\s\S]*db:\s*\n\s+condition: service_healthy/);
  assert.match(compose, /frontend:\s*[\s\S]*backend:\s*\n\s+condition: service_healthy/);
});

test('backend Docker acessa PostgreSQL pelo nome do serviço db', () => {
  const compose = ler('docker-compose.yml');
  assert.ok(compose.includes('DATABASE_URL: postgres://scientia:scientia@db:5432/scientia'));
  assert.doesNotMatch(compose, /DATABASE_URL:\s*[^\n]*(?:localhost|127\.0\.0\.1)/);
});

test('frontend possui serviços para PUT e DELETE dos CRUDs principais', () => {
  for (const arquivo of ['projetoService.js', 'publicacaoService.js', 'grupoService.js', 'vagaService.js']) {
    const service = ler(`frontend/src/servicos/${arquivo}`);
    assert.ok(service.includes("metodo: 'PUT'"), arquivo);
    assert.ok(service.includes("metodo: 'DELETE'"), arquivo);
  }
});

test('frontend protege telas de escrita e mantém relatórios e vagas públicos', () => {
  const app = ler('frontend/src/App.jsx');
  assert.match(app, /path="\/vagas" element={<Vagas \/>}/);
  assert.match(app, /path="\/relatorios" element={<Relatorios \/>}/);
  assert.match(app, /RotaProtegida tipos=\{\['pesquisador', 'admin'\]\}/);
  assert.match(app, /path="\/vagas\/:id\/editar"/);
  assert.match(app, /path="\/candidaturas"/);
});

test('validação real de projeto aceita caso válido e rejeita datas e FKs locais inválidas', () => {
  const valido = {
    titulo: 'Projeto válido',
    dataInicio: '2026-01-01',
    dataFim: '2026-12-31',
    status: 'em_andamento',
    idGrupo: 1,
    idEdital: null,
    areas: [1, 2],
  };
  assert.deepStrictEqual(validarProjeto(valido), []);
  assert.ok(validarProjeto({ ...valido, dataFim: '2025-12-31' }).includes('A data de fim não pode ser anterior à de início.'));
  assert.ok(validarProjeto({ ...valido, idGrupo: 0 }).includes('Informe um grupo válido.'));
  assert.ok(validarProjeto({ ...valido, areas: [0] }).includes('Informe áreas válidas.'));
});

test('validação real de publicação exige autoria e impede autor repetido', () => {
  const base = {
    titulo: 'Artigo válido',
    tipo: 'artigo',
    ano: 2026,
    doi: null,
    veiculo: 'Revista',
    idProjeto: 1,
    autores: [{ id: 1 }],
  };
  assert.deepStrictEqual(validarPublicacao(base), []);
  assert.ok(validarPublicacao({ ...base, autores: [] }).includes('Informe ao menos um autor.'));
  assert.ok(
    validarPublicacao({ ...base, autores: [{ id: 1 }, { id: 1 }] }).includes(
      'Não repita o mesmo autor na lista.',
    ),
  );
});

test('utilitários reais do frontend mantêm formatação e paginação esperadas', () => {
  assert.strictEqual(formatarData('2026-08-23'), '23/08/2026');
  assert.strictEqual(
    nomesDosAutores([
      { nome: 'Segundo', ordem: 2 },
      { nome: 'Primeiro', ordem: 1 },
    ]),
    'Primeiro, Segundo',
  );
  assert.strictEqual(totalDePaginas({ total: 41, porPagina: 20 }), 3);
  assert.strictEqual(podeCadastrarNoAcervo({ tipo: 'pesquisador' }), true);
  assert.strictEqual(podeCadastrarNoAcervo({ tipo: 'aluno' }), false);
});

test('validadores reais do backend rejeitam ids, enums e paginação inválidos', () => {
  assert.strictEqual(validarId('7'), 7);
  assert.strictEqual(validarInteiroOpcional('4', 'erro', { minimo: 1 }), 4);
  assert.strictEqual(validarEnumOpcional('aberta', ['aberta', 'fechada'], 'erro'), 'aberta');
  assert.deepStrictEqual(validarPaginacao({ pagina: '2', porPagina: '25' }), {
    pagina: 2,
    porPagina: 25,
    limite: 25,
    deslocamento: 25,
  });
  assert.throws(() => validarId('0'), /O id deve ser um número inteiro maior que zero/);
  assert.throws(() => validarPaginacao({ pagina: 1, porPagina: 101 }), /entre 1 e 100/);
});

test('suite de integração inclui regressões para CRUD, Views, vagas e candidaturas', () => {
  const testes = ler('backend/src/tests/api.test.js');
  for (const trecho of [
    'atualiza e exclui projetos preservando relações e cascatas',
    'atualiza autoria de publicação e exclui autorias por cascata',
    'consulta as três Views pelos endpoints de relatórios',
    'executa CRUD de vagas',
    'executa fluxo completo de candidatura pela chave composta',
    'impede candidatura em vaga fechada',
  ]) {
    assert.ok(testes.includes(trecho), trecho);
  }
});
