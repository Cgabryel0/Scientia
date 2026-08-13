import { describe, it } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';

import { autenticar, cadastrar } from '../services/usuarioService.js';

// O repositório é um singleton em memória do processo deste arquivo, então cada
// teste usa um e-mail próprio para não esbarrar nos usuários dos outros casos.
const dadosValidos = (email) => ({
  nome: 'Fulano de Tal',
  email,
  senha: 'senha-segura',
  role: 'USER',
});

describe('Validações do cadastro de usuário', () => {
  it('recusa nome com menos de 3 caracteres', async () => {
    await assert.rejects(cadastrar({ ...dadosValidos('a@teste.br'), nome: 'Jo' }), (erro) => {
      assert.strictEqual(erro.status, 400);
      assert.match(erro.message, /nome/i);
      return true;
    });
  });

  it('recusa e-mail em formato inválido', async () => {
    await assert.rejects(cadastrar(dadosValidos('sem-arroba')), (erro) => {
      assert.strictEqual(erro.status, 400);
      assert.match(erro.message, /e-mail/i);
      return true;
    });
  });

  it('recusa senha com menos de 6 caracteres', async () => {
    await assert.rejects(cadastrar({ ...dadosValidos('b@teste.br'), senha: '123' }), (erro) => {
      assert.strictEqual(erro.status, 400);
      assert.match(erro.message, /senha/i);
      return true;
    });
  });

  it('recusa papel que não é ADMIN nem USER', async () => {
    await assert.rejects(cadastrar({ ...dadosValidos('c@teste.br'), role: 'GERENTE' }), (erro) => {
      assert.strictEqual(erro.status, 400);
      assert.match(erro.message, /papel/i);
      return true;
    });
  });

  it('não permite dois cadastros com o mesmo e-mail, mesmo variando maiúsculas', async () => {
    await cadastrar(dadosValidos('duplicado@teste.br'));

    await assert.rejects(cadastrar(dadosValidos('DUPLICADO@teste.br')), (erro) => {
      assert.strictEqual(erro.status, 409);
      return true;
    });
  });

  it('guarda a senha como hash, nunca em texto puro', async () => {
    const usuario = await cadastrar(dadosValidos('hash@teste.br'));

    assert.notStrictEqual(usuario.senhaHash, 'senha-segura');
    assert.ok(await bcrypt.compare('senha-segura', usuario.senhaHash));
  });
});

describe('Autenticação', () => {
  it('devolve o usuário quando e-mail e senha conferem', async () => {
    await cadastrar(dadosValidos('login@teste.br'));

    const usuario = await autenticar('login@teste.br', 'senha-segura');
    assert.strictEqual(usuario.email, 'login@teste.br');
  });

  it('usa a mesma mensagem para e-mail inexistente e para senha errada', async () => {
    await cadastrar(dadosValidos('existe@teste.br'));

    let mensagemEmailInexistente;
    let mensagemSenhaErrada;

    await assert.rejects(autenticar('naoexiste@teste.br', 'qualquer'), (erro) => {
      assert.strictEqual(erro.status, 401);
      mensagemEmailInexistente = erro.message;
      return true;
    });

    await assert.rejects(autenticar('existe@teste.br', 'senha-errada'), (erro) => {
      assert.strictEqual(erro.status, 401);
      mensagemSenhaErrada = erro.message;
      return true;
    });

    // Se as mensagens fossem diferentes, daria para descobrir quais e-mails
    // estão cadastrados tentando logar com cada um.
    assert.strictEqual(mensagemEmailInexistente, mensagemSenhaErrada);
  });
});
