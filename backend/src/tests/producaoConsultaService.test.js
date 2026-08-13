import { describe, it } from 'node:test';
import assert from 'node:assert';
import { aplicarFiltros } from '../services/producaoConsultaService.js';

describe('Testes de Filtros de Produção', () => {
  const mockProducoes = [
    { titulo: 'Redes Neurais', autores: ['João'], tipoTrabalho: 'TCC', anoPublicacao: 2023, palavrasChave: ['IA'] },
    { titulo: 'IA na Educação', autores: ['Maria'], tipoTrabalho: 'ARTIGO', anoPublicacao: 2024, palavrasChave: ['IA', 'Ensino'] }
  ];

  it('deve filtrar corretamente pelo título de forma case-insensitive', () => {
    const filtros = { titulo: 'redes' };
    const resultado = aplicarFiltros(mockProducoes, filtros);
    assert.strictEqual(resultado.length, 1);
    assert.strictEqual(resultado[0].titulo, 'Redes Neurais');
  });

  it('deve retornar array vazio se o filtro não bater com nenhuma produção', () => {
    const filtros = { anoPublicacao: 2025 };
    const resultado = aplicarFiltros(mockProducoes, filtros);
    assert.strictEqual(resultado.length, 0);
  });
});
