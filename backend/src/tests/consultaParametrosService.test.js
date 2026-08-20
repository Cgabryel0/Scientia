import { describe, it } from 'node:test';
import assert from 'node:assert';

import { montarPadraoBusca } from '../models/buscaTextual.js';
import {
  POSTGRES_INTEGER_MAXIMO,
  POSTGRES_INTEGER_MINIMO,
  POR_PAGINA_PADRAO,
  validarEnumOpcional,
  validarId,
  validarInteiroOpcional,
  validarPaginacao,
} from '../services/consultaParametrosService.js';

function assertErroValidacao(operacao, mensagem) {
  assert.throws(operacao, (erro) => {
    assert.strictEqual(erro.status, 400);
    assert.strictEqual(erro.message, mensagem);
    return true;
  });
}

describe('Parâmetros de consulta', () => {
  it('trata strings vazias ou só com espaços como ausentes', () => {
    assert.deepStrictEqual(validarPaginacao({ pagina: '', porPagina: '   ' }), {
      pagina: 1,
      porPagina: POR_PAGINA_PADRAO,
      limite: POR_PAGINA_PADRAO,
      deslocamento: 0,
    });
    assert.strictEqual(validarInteiroOpcional(' ', 'Inteiro inválido.'), undefined);
    assert.strictEqual(validarEnumOpcional(' ', ['ativo'], 'Enum inválido.'), undefined);
  });

  it('recusa inteiros fora da faixa do INTEGER do Postgres', () => {
    const acimaDaFaixa = String(POSTGRES_INTEGER_MAXIMO + 1);
    const abaixoDaFaixa = String(POSTGRES_INTEGER_MINIMO - 1);

    assertErroValidacao(
      () => validarPaginacao({ pagina: acimaDaFaixa }),
      'A página deve ser um número inteiro maior que zero.',
    );
    assertErroValidacao(
      () => validarInteiroOpcional(acimaDaFaixa, 'O ano deve ser um número inteiro.'),
      'O ano deve ser um número inteiro.',
    );
    assertErroValidacao(
      () => validarInteiroOpcional(abaixoDaFaixa, 'O ano deve ser um número inteiro.'),
      'O ano deve ser um número inteiro.',
    );
    assertErroValidacao(() => validarId(acimaDaFaixa), 'O id deve ser um número inteiro maior que zero.');
  });

  it('recusa ids opcionais menores que um quando solicitado pelo serviço', () => {
    assertErroValidacao(
      () => validarInteiroOpcional('0', 'O id do projeto deve ser um número inteiro.', { minimo: 1 }),
      'O id do projeto deve ser um número inteiro.',
    );
  });
});

describe('Padrão ILIKE', () => {
  it('escapa curingas e barra invertida antes de montar o padrão', () => {
    assert.strictEqual(montarPadraoBusca('50% a_b \\ fim'), '%50\\% a\\_b \\\\ fim%');
  });
});
