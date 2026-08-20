import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

import { criarApp } from '../app.js';
import { ADMIN_INICIAL } from '../config/ambiente.js';
import { consultar, encerrarBanco } from '../config/bd.js';
import { garantirAdminInicial } from '../services/usuarioService.js';
import { prepararBancoTeste, reiniciarBancoTeste } from './setupBancoTeste.js';

const app = criarApp();

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

describe('Produções autenticadas', () => {
  beforeEach(reiniciarCenarioTeste);

  it('usuário autenticado cadastra produção com id inteiro da conta', async () => {
    const cadastro = await cadastrar(dadosPesquisador());

    const resposta = await request(app)
      .post('/api/producoes')
      .set('Authorization', `Bearer ${cadastro.body.token}`)
      .send({
        titulo: 'Visão Computacional na Caatinga',
        tipoTrabalho: 'ARTIGO',
        autores: ['Carlos Lima'],
        resumo: 'Detecção de espécies vegetais por imagem.',
        palavrasChave: ['visão computacional'],
        anoPublicacao: 2025,
        arquivoOuLink: 'https://exemplo.br/artigo',
      });

    assert.strictEqual(resposta.status, 201);
    assert.strictEqual(resposta.body.producao.criadoPorId, cadastro.body.usuario.id);
  });
});
});
