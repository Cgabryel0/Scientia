import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

import { criarApp } from '../app.js';

/**
 * Testes de integração: simulam as requisições HTTP que o frontend faria,
 * passando pela pilha completa (rotas, filtro de autenticação, autorização por
 * papel, controllers, services e repositórios em memória).
 */
const app = criarApp();

const cadastrar = (dados) => request(app).post('/api/auth/cadastro').send(dados);

describe('Rotas públicas', () => {
  it('GET /api/status responde sem exigir token', async () => {
    const resposta = await request(app).get('/api/status');
    assert.strictEqual(resposta.status, 200);
    assert.strictEqual(resposta.body.status, 'no ar');
  });

  it('rota desconhecida responde 404 com mensagem', async () => {
    const { body } = await cadastrar({
      nome: 'Explorador',
      email: 'explorador@teste.br',
      senha: 'senha-segura',
      role: 'USER',
    });

    const resposta = await request(app)
      .get('/api/nao-existe')
      .set('Authorization', `Bearer ${body.token}`);

    assert.strictEqual(resposta.status, 404);
  });
});

describe('Fluxo de cadastro e login', () => {
  it('cadastro válido responde 201 com token e sem o hash da senha', async () => {
    const resposta = await cadastrar({
      nome: 'Usuária Nova',
      email: 'nova@teste.br',
      senha: 'senha-segura',
      role: 'USER',
    });

    assert.strictEqual(resposta.status, 201);
    assert.ok(resposta.body.token);
    assert.strictEqual(resposta.body.usuario.email, 'nova@teste.br');
    assert.strictEqual(resposta.body.usuario.senhaHash, undefined);
  });

  it('login com credenciais corretas responde 200 com token', async () => {
    await cadastrar({ nome: 'Login Ok', email: 'loginok@teste.br', senha: 'senha-segura', role: 'USER' });

    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'loginok@teste.br', senha: 'senha-segura' });

    assert.strictEqual(resposta.status, 200);
    assert.ok(resposta.body.token);
  });

  it('login com senha errada responde 401', async () => {
    await cadastrar({ nome: 'Login Ruim', email: 'loginruim@teste.br', senha: 'senha-segura', role: 'USER' });

    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'loginruim@teste.br', senha: 'outra-senha' });

    assert.strictEqual(resposta.status, 401);
  });
});

describe('Proteção das rotas de produções', () => {
  it('GET /api/producoes sem token responde 401', async () => {
    const resposta = await request(app).get('/api/producoes');
    assert.strictEqual(resposta.status, 401);
  });

  it('usuário autenticado cadastra uma produção e a encontra na consulta com filtros', async () => {
    const { body } = await cadastrar({
      nome: 'Pesquisadora',
      email: 'pesquisadora@teste.br',
      senha: 'senha-segura',
      role: 'USER',
    });
    const autorizacao = ['Authorization', `Bearer ${body.token}`];

    const criacao = await request(app)
      .post('/api/producoes')
      .set(...autorizacao)
      .send({
        titulo: 'Visão Computacional na Caatinga',
        tipoTrabalho: 'ARTIGO',
        autores: ['Pesquisadora'],
        resumo: 'Detecção de espécies vegetais por imagem.',
        palavrasChave: ['visão computacional'],
        anoPublicacao: 2025,
        arquivoOuLink: 'https://exemplo.br/artigo',
      });
    assert.strictEqual(criacao.status, 201);

    const consulta = await request(app)
      .get('/api/producoes?busca=caatinga&tipoTrabalho=ARTIGO')
      .set(...autorizacao);

    assert.strictEqual(consulta.status, 200);
    const titulos = consulta.body.producoes.map((producao) => producao.titulo);
    assert.ok(titulos.includes('Visão Computacional na Caatinga'));
  });

  it('filtro com tipo de trabalho inválido responde 400 com mensagem', async () => {
    const { body } = await cadastrar({
      nome: 'Curiosa',
      email: 'curiosa@teste.br',
      senha: 'senha-segura',
      role: 'USER',
    });

    const resposta = await request(app)
      .get('/api/producoes?tipoTrabalho=ROMANCE')
      .set('Authorization', `Bearer ${body.token}`);

    assert.strictEqual(resposta.status, 400);
    assert.match(resposta.body.mensagem, /tipo de trabalho/i);
  });
});

describe('Autorização por papel', () => {
  it('USER autenticado recebe 403 na listagem de usuários', async () => {
    const { body } = await cadastrar({
      nome: 'Sem Privilégio',
      email: 'user403@teste.br',
      senha: 'senha-segura',
      role: 'USER',
    });

    const resposta = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${body.token}`);

    assert.strictEqual(resposta.status, 403);
  });

  it('ADMIN autenticado lista os usuários sem expor hash de senha', async () => {
    const { body } = await cadastrar({
      nome: 'Administrador Teste',
      email: 'admin200@teste.br',
      senha: 'senha-segura',
      role: 'ADMIN',
    });

    const resposta = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${body.token}`);

    assert.strictEqual(resposta.status, 200);
    assert.ok(resposta.body.usuarios.length >= 1);
    assert.ok(resposta.body.usuarios.every((usuario) => usuario.senhaHash === undefined));
  });
});

describe('Logout', () => {
  it('depois do logout o mesmo token deixa de funcionar', async () => {
    const { body } = await cadastrar({
      nome: 'De Saída',
      email: 'saida@teste.br',
      senha: 'senha-segura',
      role: 'USER',
    });
    const autorizacao = ['Authorization', `Bearer ${body.token}`];

    // Antes do logout o token vale.
    const antes = await request(app).get('/api/auth/perfil').set(...autorizacao);
    assert.strictEqual(antes.status, 200);

    const logout = await request(app).post('/api/auth/logout').set(...autorizacao);
    assert.strictEqual(logout.status, 200);

    // Depois, o mesmo token é recusado mesmo com a assinatura ainda válida.
    const depois = await request(app).get('/api/auth/perfil').set(...autorizacao);
    assert.strictEqual(depois.status, 401);
    assert.match(depois.body.mensagem, /logout/i);
  });
});
