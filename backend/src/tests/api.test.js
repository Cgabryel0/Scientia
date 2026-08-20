import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { setTimeout as aguardar } from 'node:timers/promises';
import request from 'supertest';

import { criarApp } from '../app.js';
import { ADMIN_INICIAL } from '../config/ambiente.js';
import { consultar, encerrarBanco, pool } from '../config/bd.js';
import { garantirAdminInicial } from '../services/usuarioService.js';
import { popularCenarioAcervoTeste, prepararBancoTeste, reiniciarBancoTeste } from './setupBancoTeste.js';

const app = criarApp();
const SENHA_HASH_TESTE = '$2b$10$1sOjgIPs9/ewWhYWL9EJvu0xDWtQtbWqKKc1YMh0pn9h1x87NlEya';

const cadastrar = (dados) => request(app).post('/api/auth/cadastro').send(dados);

const dadosAluno = (sobrescritos = {}) => ({
  tipo: 'aluno',
  nome: 'Ana Souza',
  email: 'ana@ufape.edu.br',
  senha: 'senha123',
  matricula: '2026010101',
  idCurso: 1,
  ...sobrescritos,
});

const dadosPesquisador = (sobrescritos = {}) => ({
  tipo: 'pesquisador',
  nome: 'Carlos Lima',
  email: 'carlos@ufape.edu.br',
  senha: 'senha123',
  numeroLattes: '1234567890123456',
  vinculo: 'docente',
  ...sobrescritos,
});

async function tokenAdmin() {
  const resposta = await request(app)
    .post('/api/auth/login')
    .send({ email: ADMIN_INICIAL.email, senha: ADMIN_INICIAL.senha });

  assert.strictEqual(resposta.status, 200);
  return resposta.body.token;
}

function validarUsuario(usuario, tipo, email) {
  assert.strictEqual(typeof usuario.id, 'number');
  assert.strictEqual(usuario.email, email);
  assert.strictEqual(usuario.tipo, tipo);
  assert.match(usuario.criadoEm, /^\d{4}-\d{2}-\d{2}T/);
  assert.strictEqual(usuario.senhaHash, undefined);
}

async function reiniciarCenarioTeste() {
  await reiniciarBancoTeste();
  await garantirAdminInicial();
}

async function reiniciarCenarioAcervoTeste() {
  await reiniciarBancoTeste();
  await popularCenarioAcervoTeste();
}

const publicacaoArtigoFixture = {
  id: 1,
  titulo: 'Análise de desempenho de algoritmos de aprendizado',
  tipo: 'artigo',
  ano: 2024,
  doi: '10.1000/exemplo.1',
  veiculo: 'Revista Brasileira de Computação',
  projeto: { id: 3, titulo: 'Inteligência artificial aplicada ao Agreste' },
  autores: [
    { id: 91, nome: 'Zuleica Souza', ordem: 1 },
    { id: 104, nome: 'Bruno Lima', ordem: 2 },
  ],
};

const projetoComputacaoFixture = {
  id: 3,
  titulo: 'Inteligência artificial aplicada ao Agreste',
  status: 'em_andamento',
  dataInicio: '2024-03-01',
  dataFim: null,
  grupo: { id: 2, nome: 'Grupo de Pesquisa em Computação Aplicada' },
  areas: [{ id: 1, nome: 'Ciência da Computação' }],
  totalPublicacoes: 2,
};

const grupoComputacaoFixture = {
  id: 2,
  nome: 'Grupo de Pesquisa em Computação Aplicada',
  linkDgp: 'http://dgp.cnpq.br/exemplo',
  anoCriacao: 2015,
  totalProjetos: 1,
  totalMembros: 2,
};

const pesquisadorZuleicaFixture = {
  id: 91,
  nome: 'Zuleica Souza',
  vinculo: 'docente',
  numeroLattes: '1234567890123456',
  totalPublicacoes: 2,
};

describe('API', () => {
  before(async () => {
    await prepararBancoTeste();
  });

  after(async () => {
    await encerrarBanco();
  });

describe('Autenticação e contas', () => {
  beforeEach(reiniciarCenarioTeste);

  it('cadastra aluno com conta e perfil', async () => {
    const resposta = await cadastrar(dadosAluno());

    assert.strictEqual(resposta.status, 201);
    assert.ok(resposta.body.token);
    validarUsuario(resposta.body.usuario, 'aluno', 'ana@ufape.edu.br');
    assert.strictEqual(resposta.body.usuario.nome, 'Ana Souza');
  });

  it('cadastra pesquisador manual com conta e perfil', async () => {
    const resposta = await cadastrar(dadosPesquisador());

    assert.strictEqual(resposta.status, 201);
    assert.ok(resposta.body.token);
    validarUsuario(resposta.body.usuario, 'pesquisador', 'carlos@ufape.edu.br');
    assert.strictEqual(resposta.body.usuario.nome, 'Carlos Lima');
  });

  it('vincula número Lattes órfão sem sobrescrever dados existentes', async () => {
    await consultar(
      `
        INSERT INTO pesquisador (nome, numero_lattes, email, vinculo, origem)
        VALUES ($1, $2, $3, $4, $5)
      `,
      ['Nome Importado', '9999999999999999', 'importado@ufape.edu.br', 'docente', 'lattes'],
    );

    const resposta = await cadastrar(
      dadosPesquisador({
        nome: 'Nome Enviado',
        email: 'novo@ufape.edu.br',
        numeroLattes: '9999999999999999',
        vinculo: 'externo',
      }),
    );

    assert.strictEqual(resposta.status, 201);
    assert.strictEqual(resposta.body.usuario.nome, 'Nome Importado');

    const perfil = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${resposta.body.token}`);

    assert.strictEqual(perfil.status, 200);
    assert.strictEqual(perfil.body.usuario.perfil.vinculo, 'docente');
    assert.strictEqual(perfil.body.usuario.perfil.origem, 'lattes');
  });

  it('recusa vínculo com pesquisador que já possui conta sem alterar o vínculo existente', async () => {
    const contaExistente = await consultar(
      `
        INSERT INTO conta (email, senha_hash, tipo)
        VALUES ($1, $2, $3)
        RETURNING id_conta
      `,
      ['pesquisador.existente@ufape.edu.br', SENHA_HASH_TESTE, 'pesquisador'],
    );
    const idContaOriginal = contaExistente.rows[0].id_conta;

    await consultar(
      `
        INSERT INTO pesquisador (id_conta, nome, numero_lattes, email, vinculo, origem)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        idContaOriginal,
        'Pesquisador Vinculado',
        '8888888888888888',
        'pesquisador.existente@ufape.edu.br',
        'docente',
        'lattes',
      ],
    );

    await consultar(
      `
        INSERT INTO pesquisador (nome, numero_lattes, email, vinculo, origem)
        VALUES ($1, $2, $3, $4, $5)
      `,
      ['Pesquisador Órfão', '7777777777777777', 'orfao@ufape.edu.br', 'docente', 'lattes'],
    );

    const resposta = await cadastrar(
      dadosPesquisador({
        nome: 'Tentativa Indevida',
        email: 'tentativa@ufape.edu.br',
        numeroLattes: '8888888888888888',
      }),
    );

    assert.strictEqual(resposta.status, 409);
    assert.strictEqual(resposta.body.mensagem, 'Esse número Lattes já pertence a outra conta.');

    const pesquisador = await consultar(
      `
        SELECT id_conta
        FROM pesquisador
        WHERE numero_lattes = $1
      `,
      ['8888888888888888'],
    );

    assert.strictEqual(pesquisador.rows[0].id_conta, idContaOriginal);
  });

  it('permite apenas um cadastro concorrente para o mesmo pesquisador órfão sem deixar conta órfã', async () => {
    const numeroLattes = '6666666666666666';
    await consultar(
      `
        INSERT INTO pesquisador (nome, numero_lattes, email, vinculo, origem)
        VALUES ($1, $2, $3, $4, $5)
      `,
      ['Pesquisador Órfão', numeroLattes, 'orfao.concorrente@ufape.edu.br', 'docente', 'lattes'],
    );

    const cliente = await pool.connect();
    let respostas;

    try {
      await cliente.query('BEGIN');
      await cliente.query('SELECT id_pesquisador FROM pesquisador WHERE numero_lattes = $1 FOR UPDATE', [
        numeroLattes,
      ]);

      const respostasPendentes = Promise.all(
        Array.from({ length: 5 }, (_, indice) =>
          cadastrar(
            dadosPesquisador({
              nome: `Concorrente ${indice}`,
              email: `concorrente${indice}@ufape.edu.br`,
              numeroLattes,
            }),
          ),
        ),
      );

      await aguardar(200);
      await cliente.query('COMMIT');

      respostas = await respostasPendentes;
    } catch (erro) {
      await cliente.query('ROLLBACK').catch(() => {});
      throw erro;
    } finally {
      cliente.release();
    }

    const status = respostas.map((resposta) => resposta.status);

    assert.strictEqual(status.filter((codigo) => codigo === 201).length, 1);
    assert.strictEqual(status.filter((codigo) => codigo === 409).length, 4);

    const contasOrfas = await consultar(`
      SELECT c.id_conta
      FROM conta c
      LEFT JOIN pesquisador p ON p.id_conta = c.id_conta
      WHERE c.tipo = 'pesquisador' AND p.id_pesquisador IS NULL
    `);

    assert.strictEqual(contasOrfas.rows.length, 0);
  });

  it('retorna 409 para email já cadastrado', async () => {
    await cadastrar(dadosAluno());

    const resposta = await cadastrar(dadosPesquisador({ email: 'ANA@UFAPE.EDU.BR' }));

    assert.strictEqual(resposta.status, 409);
    assert.strictEqual(resposta.body.mensagem, 'Já existe uma conta com esse email.');
  });

  it('retorna 409 para matrícula já usada', async () => {
    await cadastrar(dadosAluno());

    const resposta = await cadastrar(
      dadosAluno({
        nome: 'Bia Souza',
        email: 'bia@ufape.edu.br',
      }),
    );

    assert.strictEqual(resposta.status, 409);
    assert.strictEqual(resposta.body.mensagem, 'Já existe um aluno com essa matrícula.');
  });

  it('retorna 409 para Lattes já vinculado a outra conta', async () => {
    await cadastrar(dadosPesquisador());

    const resposta = await cadastrar(
      dadosPesquisador({
        nome: 'Outra Pessoa',
        email: 'outra@ufape.edu.br',
      }),
    );

    assert.strictEqual(resposta.status, 409);
    assert.strictEqual(resposta.body.mensagem, 'Esse número Lattes já pertence a outra conta.');
  });

  it('retorna 400 para tipo inválido', async () => {
    const resposta = await cadastrar(dadosAluno({ tipo: 'admin' }));

    assert.strictEqual(resposta.status, 400);
    assert.match(resposta.body.mensagem, /tipo/i);
  });

  it('retorna 400 para curso inexistente', async () => {
    const resposta = await cadastrar(dadosAluno({ idCurso: 999 }));

    assert.strictEqual(resposta.status, 400);
    assert.strictEqual(resposta.body.mensagem, 'Curso não encontrado.');
  });

  it('retorna 400 para vínculo inválido', async () => {
    const resposta = await cadastrar(dadosPesquisador({ vinculo: 'visitante' }));

    assert.strictEqual(resposta.status, 400);
    assert.match(resposta.body.mensagem, /vínculo/i);
  });

  it('faz login com credenciais corretas e normaliza email', async () => {
    await cadastrar(dadosAluno());

    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: ' ANA@UFAPE.EDU.BR ', senha: 'senha123' });

    assert.strictEqual(resposta.status, 200);
    assert.ok(resposta.body.token);
    validarUsuario(resposta.body.usuario, 'aluno', 'ana@ufape.edu.br');
  });

  it('retorna 401 com mensagem única para credenciais incorretas', async () => {
    await cadastrar(dadosAluno());

    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@ufape.edu.br', senha: 'errada123' });

    assert.strictEqual(resposta.status, 401);
    assert.strictEqual(resposta.body.mensagem, 'Email ou senha incorretos.');
  });

  it('retorna perfil de aluno com curso', async () => {
    const cadastro = await cadastrar(dadosAluno());

    const resposta = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${cadastro.body.token}`);

    assert.strictEqual(resposta.status, 200);
    validarUsuario(resposta.body.usuario, 'aluno', 'ana@ufape.edu.br');
    assert.deepStrictEqual(resposta.body.usuario.perfil, {
      matricula: '2026010101',
      curso: { id: 1, nome: 'Bacharelado em Ciência da Computação' },
    });
  });

  it('retorna perfil de pesquisador com Lattes, vínculo e origem', async () => {
    const cadastro = await cadastrar(dadosPesquisador());

    const resposta = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${cadastro.body.token}`);

    assert.strictEqual(resposta.status, 200);
    validarUsuario(resposta.body.usuario, 'pesquisador', 'carlos@ufape.edu.br');
    assert.deepStrictEqual(resposta.body.usuario.perfil, {
      numeroLattes: '1234567890123456',
      vinculo: 'docente',
      origem: 'manual',
    });
  });

  it('retorna perfil de admin sem linha de perfil', async () => {
    const token = await tokenAdmin();

    const resposta = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${token}`);

    assert.strictEqual(resposta.status, 200);
    validarUsuario(resposta.body.usuario, 'admin', ADMIN_INICIAL.email);
    assert.strictEqual(resposta.body.usuario.nome, ADMIN_INICIAL.nome);
    assert.strictEqual(resposta.body.usuario.perfil, null);
  });

  it('encerra sessão e recusa reuso do token revogado', async () => {
    const cadastro = await cadastrar(dadosAluno());
    const autorizacao = ['Authorization', `Bearer ${cadastro.body.token}`];

    const logout = await request(app).post('/api/auth/logout').set(...autorizacao);
    assert.strictEqual(logout.status, 200);
    assert.deepStrictEqual(logout.body, { mensagem: 'Sessão encerrada.' });

    const perfil = await request(app).get('/api/auth/perfil').set(...autorizacao);
    assert.strictEqual(perfil.status, 401);
  });
});

describe('Usuários e cursos', () => {
  beforeEach(reiniciarCenarioTeste);

  it('/api/usuarios lista usuários como admin', async () => {
    await cadastrar(dadosAluno());
    await cadastrar(dadosPesquisador());
    const token = await tokenAdmin();

    const resposta = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${token}`);

    assert.strictEqual(resposta.status, 200);
    assert.deepStrictEqual(
      resposta.body.usuarios.map((usuario) => usuario.tipo),
      ['admin', 'aluno', 'pesquisador'],
    );
    assert.ok(resposta.body.usuarios.every((usuario) => usuario.senhaHash === undefined));
  });

  it('/api/usuarios retorna 403 para aluno', async () => {
    const cadastro = await cadastrar(dadosAluno());

    const resposta = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${cadastro.body.token}`);

    assert.strictEqual(resposta.status, 403);
  });

  it('/api/cursos é público e ordenado por nome', async () => {
    const resposta = await request(app).get('/api/cursos');

    assert.strictEqual(resposta.status, 200);
    assert.deepStrictEqual(resposta.body.cursos, [
      { id: 3, nome: 'Bacharelado em Agronomia' },
      { id: 1, nome: 'Bacharelado em Ciência da Computação' },
      { id: 2, nome: 'Licenciatura em Computação' },
    ]);
  });
});

describe('Acervo público', () => {
  beforeEach(reiniciarCenarioAcervoTeste);

  it('/api/publicacoes lista publicações com paginação e autores ordenados', async () => {
    const resposta = await request(app).get('/api/publicacoes?tipo=artigo');

    assert.strictEqual(resposta.status, 200);
    assert.deepStrictEqual(resposta.body, {
      publicacoes: [publicacaoArtigoFixture],
      paginacao: { pagina: 1, porPagina: 20, total: 1 },
    });
  });

  it('/api/publicacoes/:id retorna detalhe público', async () => {
    const resposta = await request(app).get('/api/publicacoes/1');

    assert.strictEqual(resposta.status, 200);
    assert.deepStrictEqual(resposta.body, { publicacao: publicacaoArtigoFixture });
  });

  it('/api/publicacoes aplica busca, ano e paginação', async () => {
    const busca = await request(app).get('/api/publicacoes?busca=Carla');
    const ano = await request(app).get('/api/publicacoes?ano=2025');
    const pagina = await request(app).get('/api/publicacoes?pagina=2&porPagina=2');

    assert.strictEqual(busca.status, 200);
    assert.deepStrictEqual(
      busca.body.publicacoes.map((publicacao) => publicacao.id),
      [2, 3],
    );
    assert.deepStrictEqual(busca.body.paginacao, { pagina: 1, porPagina: 20, total: 2 });
    assert.strictEqual(ano.status, 200);
    assert.deepStrictEqual(
      ano.body.publicacoes.map((publicacao) => publicacao.id),
      [2],
    );
    assert.deepStrictEqual(ano.body.publicacoes[0].autores, [
      { id: 104, nome: 'Bruno Lima', ordem: 1 },
      { id: 117, nome: 'Carla Rocha', ordem: 2 },
      { id: 91, nome: 'Zuleica Souza', ordem: 3 },
    ]);
    assert.strictEqual(pagina.status, 200);
    assert.deepStrictEqual(
      pagina.body.publicacoes.map((publicacao) => publicacao.id),
      [3],
    );
    assert.deepStrictEqual(pagina.body.paginacao, { pagina: 2, porPagina: 2, total: 3 });
  });

  it('/api/publicacoes valida filtros e inexistência', async () => {
    const tipo = await request(app).get('/api/publicacoes?tipo=tcc');
    const ano = await request(app).get('/api/publicacoes?ano=abc');
    const porPagina = await request(app).get('/api/publicacoes?porPagina=101');
    const inexistente = await request(app).get('/api/publicacoes/999');

    assert.strictEqual(tipo.status, 400);
    assert.strictEqual(tipo.body.mensagem, 'O tipo deve ser artigo, capítulo ou resumo.');
    assert.strictEqual(ano.status, 400);
    assert.strictEqual(ano.body.mensagem, 'O ano deve ser um número inteiro.');
    assert.strictEqual(porPagina.status, 400);
    assert.strictEqual(porPagina.body.mensagem, 'A quantidade por página deve ser um número inteiro entre 1 e 100.');
    assert.strictEqual(inexistente.status, 404);
    assert.strictEqual(inexistente.body.mensagem, 'Publicação não encontrada.');
  });

  it('/api/projetos lista projetos com filtros', async () => {
    const status = await request(app).get('/api/projetos?status=em_andamento');
    const idGrupo = await request(app).get('/api/projetos?idGrupo=2');

    assert.strictEqual(status.status, 200);
    assert.deepStrictEqual(status.body, {
      projetos: [projetoComputacaoFixture],
      paginacao: { pagina: 1, porPagina: 20, total: 1 },
    });
    assert.strictEqual(idGrupo.status, 200);
    assert.deepStrictEqual(idGrupo.body.projetos, [projetoComputacaoFixture]);
  });

  it('/api/projetos/:id retorna detalhe com edital, equipe, áreas e publicações', async () => {
    const resposta = await request(app).get('/api/projetos/3');

    assert.strictEqual(resposta.status, 200);
    assert.deepStrictEqual(resposta.body, {
      projeto: {
        id: 3,
        titulo: 'Inteligência artificial aplicada ao Agreste',
        resumo: 'Estuda a aplicação de aprendizado de máquina no contexto regional.',
        status: 'em_andamento',
        dataInicio: '2024-03-01',
        dataFim: null,
        origem: 'manual',
        grupo: { id: 2, nome: 'Grupo de Pesquisa em Computação Aplicada' },
        edital: { id: 7, nome: 'Edital Universal nº 03/2022', ano: 2022 },
        areas: [{ id: 1, nome: 'Ciência da Computação' }],
        equipe: [
          { id: 91, nome: 'Zuleica Souza', papel: 'coordenador', dataEntrada: '2024-03-01' },
          { id: 104, nome: 'Bruno Lima', papel: 'participante', dataEntrada: '2024-03-10' },
        ],
        publicacoes: [
          { id: 2, titulo: 'Redes neurais para previsão climática no Agreste', tipo: 'resumo', ano: 2025 },
          { id: 1, titulo: 'Análise de desempenho de algoritmos de aprendizado', tipo: 'artigo', ano: 2024 },
        ],
      },
    });
  });

  it('/api/projetos valida status e inexistência', async () => {
    const status = await request(app).get('/api/projetos?status=ativo');
    const inexistente = await request(app).get('/api/projetos/999');

    assert.strictEqual(status.status, 400);
    assert.strictEqual(status.body.mensagem, 'O status deve ser planejado, em_andamento, concluido ou cancelado.');
    assert.strictEqual(inexistente.status, 404);
    assert.strictEqual(inexistente.body.mensagem, 'Projeto não encontrado.');
  });

  it('/api/grupos lista grupos em ordem alfabética crescente', async () => {
    const resposta = await request(app).get('/api/grupos');

    assert.strictEqual(resposta.status, 200);
    assert.deepStrictEqual(
      resposta.body.grupos.map((grupo) => grupo.nome),
      ['Grupo de Pesquisa em Agroecologia Digital', 'Grupo de Pesquisa em Computação Aplicada'],
    );
    assert.deepStrictEqual(resposta.body.paginacao, { pagina: 1, porPagina: 20, total: 2 });
  });

  it('/api/grupos lista grupos e retorna detalhe', async () => {
    const lista = await request(app).get('/api/grupos?busca=Computação');
    const detalhe = await request(app).get('/api/grupos/2');

    assert.strictEqual(lista.status, 200);
    assert.deepStrictEqual(lista.body, {
      grupos: [grupoComputacaoFixture],
      paginacao: { pagina: 1, porPagina: 20, total: 1 },
    });
    assert.strictEqual(detalhe.status, 200);
    assert.deepStrictEqual(detalhe.body, {
      grupo: {
        id: 2,
        nome: 'Grupo de Pesquisa em Computação Aplicada',
        linkDgp: 'http://dgp.cnpq.br/exemplo',
        anoCriacao: 2015,
        membros: [
          { id: 91, nome: 'Zuleica Souza', papel: 'lider' },
          { id: 104, nome: 'Bruno Lima', papel: 'membro' },
        ],
        projetos: [{ id: 3, titulo: 'Inteligência artificial aplicada ao Agreste', status: 'em_andamento' }],
      },
    });
  });

  it('/api/pesquisadores lista sem vazar email', async () => {
    const resposta = await request(app).get('/api/pesquisadores?busca=Zuleica');

    assert.strictEqual(resposta.status, 200);
    assert.deepStrictEqual(resposta.body, {
      pesquisadores: [pesquisadorZuleicaFixture],
      paginacao: { pagina: 1, porPagina: 20, total: 1 },
    });
    assert.strictEqual(Object.hasOwn(resposta.body.pesquisadores[0], 'email'), false);
  });

  it('/api/pesquisadores lista pesquisadores em ordem alfabética crescente', async () => {
    const resposta = await request(app).get('/api/pesquisadores');

    assert.strictEqual(resposta.status, 200);
    assert.deepStrictEqual(
      resposta.body.pesquisadores.map((pesquisador) => pesquisador.nome),
      ['Bruno Lima', 'Carla Rocha', 'Zuleica Souza'],
    );
    assert.deepStrictEqual(resposta.body.paginacao, { pagina: 1, porPagina: 20, total: 3 });
  });

  it('/api/areas lista áreas ordenadas por nome', async () => {
    const resposta = await request(app).get('/api/areas');

    assert.strictEqual(resposta.status, 200);
    assert.deepStrictEqual(resposta.body, {
      areas: [
        { id: 2, nome: 'Agronomia' },
        { id: 1, nome: 'Ciência da Computação' },
      ],
    });
  });

});
});
