import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Relatorios } from '../paginas/Relatorios.jsx';
import * as relatorioService from '../servicos/relatorioService.js';

vi.mock('../servicos/relatorioService.js', () => ({
  listarProjetos: vi.fn(),
  listarPublicacoes: vi.fn(),
  listarGrupos: vi.fn(),
}));

const projeto = {
  idProjeto: 3,
  titulo: 'Projeto de IA',
  status: 'em_andamento',
  dataInicio: '2024-03-01',
  nomeGrupo: 'Grupo de Computação',
  nomeEdital: 'Edital Universal',
  anoEdital: 2024,
  quantidadePublicacoes: 2,
};

const publicacao = {
  idPublicacao: 8,
  tituloPublicacao: 'Artigo de IA',
  tipo: 'artigo',
  ano: 2026,
  tituloProjeto: 'Projeto de IA',
  nomeGrupo: 'Grupo de Computação',
  idPesquisador: 4,
  nomeAutor: 'Ana Silva',
  ordemAutor: 1,
};

const grupo = {
  idGrupo: 2,
  nomeGrupo: 'Grupo de Computação',
  lideres: 'Ana Silva',
  quantidadePesquisadores: 4,
  quantidadeProjetos: 3,
  projetosEmAndamento: 1,
};

describe('Tela de relatórios', () => {
  beforeEach(() => {
    relatorioService.listarProjetos.mockResolvedValue({ projetos: [projeto] });
    relatorioService.listarPublicacoes.mockResolvedValue({ publicacoes: [publicacao] });
    relatorioService.listarGrupos.mockResolvedValue({ grupos: [grupo] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('carrega e mostra os dados das três Views na mesma tela', async () => {
    render(<Relatorios />);
    expect(screen.getByText(/carregando relatórios/i)).toBeInTheDocument();

    await act(async () => {});

    expect(screen.getByRole('heading', { name: 'Projetos detalhados' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Produção bibliográfica' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Grupos de pesquisa' })).toBeInTheDocument();
    expect(screen.getAllByText('Projeto de IA').length).toBeGreaterThan(0);
    expect(screen.getByText('Artigo de IA')).toBeInTheDocument();
    expect(screen.getAllByText('Grupo de Computação').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ana Silva').length).toBeGreaterThan(0);
  });

  it('mostra o erro de qualquer endpoint sem esconder o título da página', async () => {
    relatorioService.listarProjetos.mockRejectedValue(new Error('Falha ao consultar a View.'));

    render(<Relatorios />);
    await act(async () => {});

    expect(screen.getByRole('heading', { name: 'Relatórios' })).toBeInTheDocument();
    expect(screen.getByText('Falha ao consultar a View.')).toBeInTheDocument();
  });
});
