import { describe, expect, it } from 'vitest';

import { validarProjeto } from '../utils/validacaoProjeto.js';
import { validarPublicacao } from '../utils/validacaoPublicacao.js';
import { CORPO_NOVA_PUBLICACAO, CORPO_NOVO_PROJETO } from './fixturesAcervo.js';

const [autorExistente, autorNovo] = CORPO_NOVA_PUBLICACAO.autores;

describe('Validação de publicação no cliente', () => {
  it('aceita o corpo da spec sem apontar problema', () => {
    expect(validarPublicacao(CORPO_NOVA_PUBLICACAO)).toEqual([]);
  });

  it('cobra o título, o veículo e o projeto quando faltam', () => {
    const problemas = validarPublicacao({
      ...CORPO_NOVA_PUBLICACAO,
      titulo: '   ',
      veiculo: '',
      idProjeto: null,
    });

    expect(problemas).toContain('Informe o título.');
    expect(problemas).toContain('Informe o veículo.');
    expect(problemas).toContain('Informe um projeto válido.');
  });

  it('recusa tipo fora do enum do banco', () => {
    expect(validarPublicacao({ ...CORPO_NOVA_PUBLICACAO, tipo: 'monografia' })).toContain(
      'O tipo deve ser artigo, capítulo ou resumo.',
    );
  });

  it.each([1949, 2101, 2024.5, Number.NaN])('recusa o ano %s', (ano) => {
    expect(validarPublicacao({ ...CORPO_NOVA_PUBLICACAO, ano })).toContain(
      'O ano deve ser um número inteiro entre 1950 e 2100.',
    );
  });

  it.each([1950, 2100])('aceita o ano %s, que é limite da faixa', (ano) => {
    expect(validarPublicacao({ ...CORPO_NOVA_PUBLICACAO, ano })).toEqual([]);
  });

  it('cobra os tamanhos máximos de título, veículo e DOI', () => {
    const problemas = validarPublicacao({
      ...CORPO_NOVA_PUBLICACAO,
      titulo: 'a'.repeat(256),
      veiculo: 'b'.repeat(151),
      doi: 'c'.repeat(101),
    });

    expect(problemas).toEqual([
      'O título deve ter no máximo 255 caracteres.',
      'O veículo deve ter no máximo 150 caracteres.',
      'O DOI deve ter no máximo 100 caracteres.',
    ]);
  });

  it('aceita publicação sem DOI', () => {
    expect(validarPublicacao({ ...CORPO_NOVA_PUBLICACAO, doi: '' })).toEqual([]);
  });

  it('exige ao menos um autor', () => {
    expect(validarPublicacao({ ...CORPO_NOVA_PUBLICACAO, autores: [] })).toContain(
      'Informe ao menos um autor.',
    );
  });

  it('recusa autor que mistura id com dados de autor novo', () => {
    expect(
      validarPublicacao({
        ...CORPO_NOVA_PUBLICACAO,
        autores: [{ ...autorNovo, ...autorExistente }],
      }),
    ).toContain('Informe um autor existente ou os dados de um autor novo.');
  });

  it('recusa autor novo sem vínculo válido', () => {
    expect(
      validarPublicacao({
        ...CORPO_NOVA_PUBLICACAO,
        autores: [{ ...autorNovo, vinculo: 'colaborador' }],
      }),
    ).toContain('Informe um autor existente ou os dados de um autor novo.');
  });

  it('recusa o mesmo pesquisador repetido, por id ou por Lattes', () => {
    expect(
      validarPublicacao({ ...CORPO_NOVA_PUBLICACAO, autores: [autorExistente, autorExistente] }),
    ).toContain('Não repita o mesmo autor na lista.');

    expect(
      validarPublicacao({
        ...CORPO_NOVA_PUBLICACAO,
        autores: [autorNovo, { ...autorNovo, nome: 'Bruno L.' }],
      }),
    ).toContain('Não repita o mesmo autor na lista.');
  });
});

describe('Validação de projeto no cliente', () => {
  it('aceita o corpo da spec sem apontar problema', () => {
    expect(validarProjeto(CORPO_NOVO_PROJETO)).toEqual([]);
  });

  it('aceita projeto sem áreas escolhidas', () => {
    expect(validarProjeto({ ...CORPO_NOVO_PROJETO, areas: [] })).toEqual([]);
  });

  it('recusa situação fora do enum do banco', () => {
    expect(validarProjeto({ ...CORPO_NOVO_PROJETO, status: 'suspenso' })).toContain(
      'O status deve ser planejado, em_andamento, concluido ou cancelado.',
    );
  });

  it.each(['', '01/03/2024', '2024-02-31'])('recusa a data de início %s', (dataInicio) => {
    expect(validarProjeto({ ...CORPO_NOVO_PROJETO, dataInicio })).toContain(
      'Informe a data de início no formato YYYY-MM-DD.',
    );
  });

  it('recusa data de fim anterior à de início', () => {
    expect(validarProjeto({ ...CORPO_NOVO_PROJETO, dataFim: '2024-02-29' })).toContain(
      'A data de fim não pode ser anterior à de início.',
    );
  });

  it('aceita data de fim igual à de início', () => {
    expect(validarProjeto({ ...CORPO_NOVO_PROJETO, dataFim: '2024-03-01' })).toEqual([]);
  });

  it('cobra o grupo, que é obrigatório no modelo relacional', () => {
    expect(validarProjeto({ ...CORPO_NOVO_PROJETO, idGrupo: null })).toContain(
      'Informe um grupo válido.',
    );
  });

  it('cobra o título quando falta e limita o tamanho', () => {
    expect(validarProjeto({ ...CORPO_NOVO_PROJETO, titulo: '  ' })).toContain('Informe o título.');
    expect(validarProjeto({ ...CORPO_NOVO_PROJETO, titulo: 'a'.repeat(256) })).toContain(
      'O título deve ter no máximo 255 caracteres.',
    );
  });
});
