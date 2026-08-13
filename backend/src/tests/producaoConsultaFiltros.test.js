import { describe, it } from 'node:test';
import assert from 'node:assert';

import { aplicarFiltros, listar } from '../services/producaoConsultaService.js';
import { novaProducao } from '../models/ProducaoCientifica.js';
import * as repositorio from '../models/repositorioProducoes.js';

describe('Busca unificada e validação da consulta', () => {
  const mockProducoes = [
    {
      titulo: 'Redes Neurais no Agreste',
      autores: ['João Silva'],
      tipoTrabalho: 'TCC',
      anoPublicacao: 2023,
      palavrasChave: ['IA'],
    },
    {
      titulo: 'Compiladores Educacionais',
      autores: ['Maria Souza'],
      tipoTrabalho: 'ARTIGO',
      anoPublicacao: 2024,
      palavrasChave: ['ensino', 'linguagens'],
    },
  ];

  it('busca casa com o título sem diferenciar maiúsculas', () => {
    const resultado = aplicarFiltros(mockProducoes, { busca: 'REDES' });
    assert.strictEqual(resultado.length, 1);
    assert.strictEqual(resultado[0].titulo, 'Redes Neurais no Agreste');
  });

  it('busca casa com o nome de um autor', () => {
    const resultado = aplicarFiltros(mockProducoes, { busca: 'maria' });
    assert.strictEqual(resultado.length, 1);
    assert.strictEqual(resultado[0].titulo, 'Compiladores Educacionais');
  });

  it('busca casa com uma palavra-chave', () => {
    const resultado = aplicarFiltros(mockProducoes, { busca: 'ensino' });
    assert.strictEqual(resultado.length, 1);
    assert.strictEqual(resultado[0].titulo, 'Compiladores Educacionais');
  });

  it('busca combinada com tipo exige que os dois filtros passem', () => {
    // "a" aparece nos dois títulos, mas só um é ARTIGO.
    const resultado = aplicarFiltros(mockProducoes, { busca: 'a', tipoTrabalho: 'ARTIGO' });
    assert.strictEqual(resultado.length, 1);
    assert.strictEqual(resultado[0].tipoTrabalho, 'ARTIGO');
  });

  it('listar recusa tipo de trabalho inválido com erro 400', async () => {
    await assert.rejects(listar({ tipoTrabalho: 'ROMANCE' }), (erro) => {
      assert.strictEqual(erro.status, 400);
      assert.match(erro.message, /tipo de trabalho/i);
      return true;
    });
  });

  it('listar recusa ano que não é número inteiro com erro 400', async () => {
    await assert.rejects(listar({ anoPublicacao: 'dois mil' }), (erro) => {
      assert.strictEqual(erro.status, 400);
      assert.match(erro.message, /ano de publicação/i);
      return true;
    });
  });

  it('listar ordena por ano decrescente, com o cadastro mais novo primeiro em caso de empate', async () => {
    // Cada arquivo de teste roda em um processo próprio, então dá para semear o
    // repositório em memória sem interferir nos outros testes. O criadoEm é
    // fixado à mão porque duas produções salvas em sequência podem cair no
    // mesmo milissegundo, o que tornaria o desempate imprevisível.
    const base = {
      autores: ['Autor'],
      resumo: 'Resumo.',
      palavrasChave: ['teste'],
      arquivoOuLink: 'https://exemplo.br',
      criadoPorId: 'id-teste',
    };

    const semear = (titulo, anoPublicacao, criadoEm) =>
      repositorio.salvar({
        ...novaProducao({ ...base, titulo, tipoTrabalho: 'OUTRO', anoPublicacao }),
        criadoEm,
      });

    semear('Antiga', 2020, '2026-08-13T10:00:00.000Z');
    semear('Recente A', 2026, '2026-08-13T10:00:01.000Z');
    semear('Recente B', 2026, '2026-08-13T10:00:02.000Z');

    const resultado = await listar({});
    const titulos = resultado.map((producao) => producao.titulo);

    // 2026 antes de 2020; entre as duas de 2026, a cadastrada por último vem primeiro.
    assert.deepStrictEqual(titulos, ['Recente B', 'Recente A', 'Antiga']);
  });
});
