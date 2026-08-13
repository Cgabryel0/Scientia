import { afterEach, describe, expect, it, vi } from 'vitest';

import { requisitar } from '../servicos/api.js';
import { listar, montarQueryDeFiltros } from '../servicos/producaoConsultaService.js';

describe('montarQueryDeFiltros', () => {
  it('inclui só os filtros preenchidos', () => {
    const query = montarQueryDeFiltros({ busca: 'redes', tipoTrabalho: '', anoPublicacao: '' });
    expect(query).toBe('busca=redes');
  });

  it('devolve string vazia quando nenhum filtro está preenchido', () => {
    expect(montarQueryDeFiltros({ busca: '', tipoTrabalho: '' })).toBe('');
  });

  it('codifica valores com espaços e acentos para a URL', () => {
    const query = montarQueryDeFiltros({ busca: 'visão computacional' });
    expect(query).toBe('busca=vis%C3%A3o+computacional');
  });
});

describe('requisitar (serviço central de API)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const respostaFalsa = (ok, status, corpo) =>
    Promise.resolve({ ok, status, json: () => Promise.resolve(corpo) });

  it('devolve o JSON quando a resposta é de sucesso', async () => {
    vi.stubGlobal('fetch', vi.fn(() => respostaFalsa(true, 200, { producoes: [] })));

    await expect(requisitar('/producoes')).resolves.toEqual({ producoes: [] });
  });

  it('manda o token no cabeçalho Authorization', async () => {
    const fetchFalso = vi.fn(() => respostaFalsa(true, 200, {}));
    vi.stubGlobal('fetch', fetchFalso);

    await listar({ busca: 'ia' }, 'token-de-teste');

    const [url, opcoes] = fetchFalso.mock.calls[0];
    expect(url).toContain('/producoes?busca=ia');
    expect(opcoes.headers.Authorization).toBe('Bearer token-de-teste');
  });

  it('erro HTTP vira uma exceção com a mensagem enviada pelo backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => respostaFalsa(false, 400, { mensagem: 'O tipo de trabalho deve ser um de: ...' })),
    );

    await expect(requisitar('/producoes')).rejects.toThrow(/tipo de trabalho/i);
  });

  it('falha de rede vira uma mensagem amigável', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));

    await expect(requisitar('/producoes')).rejects.toThrow(/API está no ar/i);
  });
});
