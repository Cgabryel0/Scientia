import { describe, it } from 'node:test';
import assert from 'node:assert';

import { gerarToken, revogarToken, validarToken } from '../services/tokenService.js';

const usuarioFalso = {
  id: 151,
  nome: 'Fulano de Tal',
  email: 'fulano@teste.br',
  tipo: 'admin',
};

describe('Ciclo de vida do token JWT', () => {
  it('o token gerado carrega identificador, nome, email e tipo do usuário', () => {
    const conteudo = validarToken(gerarToken(usuarioFalso));

    assert.strictEqual(conteudo.sub, String(usuarioFalso.id));
    assert.strictEqual(conteudo.nome, usuarioFalso.nome);
    assert.strictEqual(conteudo.email, usuarioFalso.email);
    assert.strictEqual(conteudo.tipo, usuarioFalso.tipo);
  });

  it('recusa token adulterado com erro 401', () => {
    const adulterado = `${gerarToken(usuarioFalso)}x`;

    assert.throws(() => validarToken(adulterado), (erro) => {
      assert.strictEqual(erro.status, 401);
      assert.match(erro.message, /inválido/i);
      return true;
    });
  });

  it('recusa token revogado no logout, mesmo que a assinatura ainda seja válida', () => {
    const token = gerarToken(usuarioFalso);
    const conteudo = validarToken(token);

    revogarToken(conteudo);

    assert.throws(() => validarToken(token), (erro) => {
      assert.strictEqual(erro.status, 401);
      assert.match(erro.message, /logout/i);
      return true;
    });
  });

  it('a revogação de um token não afeta os tokens dos demais usuários', () => {
    const tokenRevogado = gerarToken(usuarioFalso);
    const tokenDeOutraSessao = gerarToken(usuarioFalso);

    revogarToken(validarToken(tokenRevogado));

    assert.ok(validarToken(tokenDeOutraSessao));
  });
});
