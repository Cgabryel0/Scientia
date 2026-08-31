import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IndicadoresProducoes } from '../paginas/IndicadoresProducoes.jsx';
import * as relatorioService from '../servicos/relatorioService.js';

const sessaoFalsa = { token: 'token-indicadores' };

vi.mock('../contexto/AuthContext.jsx', () => ({
  useAuth: () => sessaoFalsa,
}));

vi.mock('../servicos/relatorioService.js', () => ({
  obterIndicadoresProducoes: vi.fn(),
}));

const indicadores = {
  totalProducoes: 4,
  porAno: [
    { ano: 2023, quantidade: 1 },
    { ano: 2024, quantidade: 2 },
    { ano: 2025, quantidade: 1 },
  ],
  porTipo: [
    { tipo: 'artigo', quantidade: 2 },
    { tipo: 'capitulo', quantidade: 1 },
    { tipo: 'resumo', quantidade: 1 },
  ],
  porArea: [
    { idArea: 1, nome: 'Ciência da Computação', quantidade: 3 },
    { idArea: 2, nome: 'Agronomia', quantidade: 1 },
  ],
  areasDestaque: [{ idArea: 1, nome: 'Ciência da Computação', quantidade: 3 }],
};

describe('Tela de indicadores de produções científicas', () => {
  beforeEach(() => {
    sessaoFalsa.token = 'token-indicadores';
    relatorioService.obterIndicadoresProducoes.mockResolvedValue({ indicadores });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('usa o token da sessão e exibe os indicadores consolidados', async () => {
    render(<IndicadoresProducoes />);
    expect(screen.getByText(/carregando indicadores/i)).toBeInTheDocument();

    await act(async () => {});

    expect(relatorioService.obterIndicadoresProducoes).toHaveBeenCalledWith('token-indicadores');
    expect(
      screen.getByRole('heading', { name: 'Indicadores de produções científicas' }),
    ).toBeInTheDocument();

    const cartaoTotal = screen.getByText('Total de produções').closest('article');
    expect(within(cartaoTotal).getByText('4')).toBeInTheDocument();

    const cartaoPeriodo = screen.getByText('Período da produção').closest('article');
    expect(within(cartaoPeriodo).getByText('2023–2025')).toBeInTheDocument();

    const cartaoArea = screen.getByText('Área(s) com mais produções').closest('article');
    expect(within(cartaoArea).getByText('Ciência da Computação')).toBeInTheDocument();
    expect(within(cartaoArea).getByText('3 produções')).toBeInTheDocument();
  });

  it('mostra evolução anual, tipos e ranking de áreas', async () => {
    render(<IndicadoresProducoes />);
    await act(async () => {});

    const porAno = screen.getByRole('table', { name: 'Produções por ano' });
    const linhasAno = within(porAno).getAllByRole('row');
    expect(within(linhasAno[1]).getByText('2023')).toBeInTheDocument();
    expect(within(linhasAno[2]).getByText('2024')).toBeInTheDocument();
    expect(within(linhasAno[3]).getByText('2025')).toBeInTheDocument();

    const porTipo = screen.getByRole('table', { name: 'Produções por tipo' });
    expect(within(porTipo).getByText('Artigo')).toBeInTheDocument();
    expect(within(porTipo).getByText('Capítulo')).toBeInTheDocument();
    expect(within(porTipo).getByText('Resumo')).toBeInTheDocument();

    const porArea = screen.getByRole('table', { name: 'Produções por área de pesquisa' });
    const linhasArea = within(porArea).getAllByRole('row');
    expect(within(linhasArea[1]).getByText('Ciência da Computação')).toBeInTheDocument();
    expect(within(linhasArea[2]).getByText('Agronomia')).toBeInTheDocument();
  });

  it('trata cenário sem produções sem esconder o resumo', async () => {
    relatorioService.obterIndicadoresProducoes.mockResolvedValue({
      indicadores: {
        totalProducoes: 0,
        porAno: [],
        porTipo: [],
        porArea: [],
        areasDestaque: [],
      },
    });

    render(<IndicadoresProducoes />);
    await act(async () => {});

    expect(screen.getByText(/ainda não há produções cadastradas/i)).toBeInTheDocument();
    expect(screen.getByText('Período da produção').closest('article')).toHaveTextContent('—');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('mostra falha da API sem esconder a identificação da página', async () => {
    relatorioService.obterIndicadoresProducoes.mockRejectedValue(
      new Error('Não foi possível carregar os indicadores.'),
    );

    render(<IndicadoresProducoes />);
    await act(async () => {});

    expect(
      screen.getByRole('heading', { name: 'Indicadores de produções científicas' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Não foi possível carregar os indicadores.')).toBeInTheDocument();
  });
});
