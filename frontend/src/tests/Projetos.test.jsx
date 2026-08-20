import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Projetos } from '../paginas/Projetos.jsx';
import * as projetoService from '../servicos/projetoService.js';
import { RESPOSTA_PROJETOS } from './fixturesAcervo.js';

vi.mock('../servicos/projetoService.js', () => ({
  listar: vi.fn(),
  buscarPorId: vi.fn(),
}));

function renderizarTela() {
  return render(
    <MemoryRouter>
      <Projetos />
    </MemoryRouter>,
  );
}

describe('Tela de projetos de pesquisa', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    projetoService.listar.mockResolvedValue(RESPOSTA_PROJETOS);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('mostra o cartão do projeto com situação, grupo, áreas e total de publicações', async () => {
    renderizarTela();
    expect(screen.getByText(/carregando projetos/i)).toBeInTheDocument();

    await act(async () => {});

    const cartao = screen
      .getByRole('link', { name: 'Inteligência artificial aplicada ao Agreste' })
      .closest('li');

    expect(within(cartao).getByText('Em andamento')).toBeInTheDocument();
    expect(within(cartao).getByText('4 publicações')).toBeInTheDocument();
    expect(within(cartao).getByText('Ciência da Computação')).toBeInTheDocument();
    expect(
      within(cartao).getByRole('link', { name: 'Grupo de Pesquisa em Computação Aplicada' }),
    ).toHaveAttribute('href', '/grupos/2');
    expect(
      within(cartao).getByRole('link', { name: 'Inteligência artificial aplicada ao Agreste' }),
    ).toHaveAttribute('href', '/projetos/3');
  });

  it('escolher a situação chama o serviço com o filtro de status', async () => {
    renderizarTela();
    await act(async () => {});

    fireEvent.change(screen.getByLabelText('Situação'), { target: { value: 'concluido' } });
    await act(async () => {});

    expect(projetoService.listar).toHaveBeenLastCalledWith({
      busca: '',
      status: 'concluido',
      pagina: 1,
      porPagina: 20,
    });
  });

  it('avançar a paginação pede a página seguinte ao serviço', async () => {
    renderizarTela();
    await act(async () => {});

    expect(screen.getByText(/página 1 de 6 · 120 resultados/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /próxima/i }));
    await act(async () => {});

    expect(projetoService.listar).toHaveBeenLastCalledWith({
      busca: '',
      status: '',
      pagina: 2,
      porPagina: 20,
    });
  });
});
