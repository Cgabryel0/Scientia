import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DetalheProjeto } from '../paginas/DetalheProjeto.jsx';
import * as projetoService from '../servicos/projetoService.js';
import { RESPOSTA_PROJETO } from './fixturesAcervo.js';

vi.mock('../servicos/projetoService.js', () => ({
  listar: vi.fn(),
  buscarPorId: vi.fn(),
}));

function renderizarTela() {
  return render(
    <MemoryRouter initialEntries={['/projetos/3']}>
      <Routes>
        <Route path="/projetos/:id" element={<DetalheProjeto />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Detalhe do projeto de pesquisa', () => {
  beforeEach(() => {
    projetoService.buscarPorId.mockResolvedValue(RESPOSTA_PROJETO);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('busca o projeto pelo id da rota e mostra a ficha completa', async () => {
    renderizarTela();
    expect(screen.getByText(/carregando projeto/i)).toBeInTheDocument();

    await act(async () => {});

    expect(projetoService.buscarPorId).toHaveBeenCalledWith('3');
    expect(
      screen.getByRole('heading', { name: 'Inteligência artificial aplicada ao Agreste' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Estuda a aplicação de aprendizado de máquina...')).toBeInTheDocument();
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
    expect(screen.getByText('01/03/2024 — em andamento')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Grupo de Pesquisa em Computação Aplicada' }),
    ).toHaveAttribute('href', '/grupos/2');
    expect(screen.getByText('Ciência da Computação')).toBeInTheDocument();
  });

  it('mostra o nome e o ano do edital quando o projeto tem um', async () => {
    renderizarTela();
    await act(async () => {});

    expect(screen.getByText('Edital Universal nº 03/2022 (2022)')).toBeInTheDocument();
    expect(screen.queryByText(/sem edital vinculado/i)).not.toBeInTheDocument();
  });

  it('avisa que não há edital quando o campo vem nulo', async () => {
    projetoService.buscarPorId.mockResolvedValue({
      projeto: { ...RESPOSTA_PROJETO.projeto, edital: null },
    });

    renderizarTela();
    await act(async () => {});

    expect(screen.getByText(/sem edital vinculado/i)).toBeInTheDocument();
    expect(screen.queryByText(/Edital Universal/)).not.toBeInTheDocument();
  });

  it('mostra a equipe com o papel e as publicações do projeto', async () => {
    renderizarTela();
    await act(async () => {});

    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('Coordenador')).toBeInTheDocument();
    expect(screen.getByText('desde 01/03/2024')).toBeInTheDocument();
    expect(screen.getByText('Análise de desempenho...')).toBeInTheDocument();
    expect(screen.getByText('Artigo')).toBeInTheDocument();
  });

  it('mostra o período fechado quando o projeto já terminou', async () => {
    projetoService.buscarPorId.mockResolvedValue({
      projeto: { ...RESPOSTA_PROJETO.projeto, status: 'concluido', dataFim: '2025-12-31' },
    });

    renderizarTela();
    await act(async () => {});

    expect(screen.getByText('01/03/2024 a 31/12/2025')).toBeInTheDocument();
  });

  it('mostra o alerta de erro quando o projeto não existe', async () => {
    projetoService.buscarPorId.mockRejectedValue(new Error('Projeto não encontrado.'));

    renderizarTela();
    await act(async () => {});

    expect(screen.getByText('Projeto não encontrado.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar para a lista de projetos/i })).toBeInTheDocument();
  });
});
