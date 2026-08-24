import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Candidaturas } from '../paginas/Candidaturas.jsx';
import * as candidaturaService from '../servicos/candidaturaService.js';
import * as vagaService from '../servicos/vagaService.js';

vi.mock('../servicos/candidaturaService.js', () => ({
  listar: vi.fn(),
  cadastrar: vi.fn(),
  atualizar: vi.fn(),
  excluir: vi.fn(),
}));

vi.mock('../servicos/vagaService.js', () => ({
  listar: vi.fn(),
}));

const sessaoFalsa = {
  usuario: { id: 10, nome: 'Aluno', tipo: 'aluno' },
  token: 'token-aluno',
};

vi.mock('../contexto/AuthContext.jsx', () => ({
  useAuth: () => sessaoFalsa,
}));

const candidatura = {
  aluno: { id: 7, nome: 'Aluno Teste', matricula: '20260001' },
  vaga: {
    id: 5,
    titulo: 'Vaga de IA',
    projeto: { id: 3, titulo: 'Projeto de IA' },
  },
  status: 'pendente',
  dataCandidatura: '2026-08-23',
};

const respostaLista = {
  candidaturas: [candidatura],
  paginacao: { pagina: 1, porPagina: 20, total: 1 },
};

const respostaVagas = {
  vagas: [
    {
      id: 5,
      titulo: 'Vaga de IA',
      projeto: { id: 3, titulo: 'Projeto de IA' },
    },
  ],
};

describe('Tela de candidaturas', () => {
  beforeEach(() => {
    sessaoFalsa.usuario = { id: 10, nome: 'Aluno', tipo: 'aluno' };
    sessaoFalsa.token = 'token-aluno';
    candidaturaService.listar.mockResolvedValue(respostaLista);
    candidaturaService.cadastrar.mockResolvedValue({ candidatura });
    candidaturaService.atualizar.mockResolvedValue({ candidatura: { ...candidatura, status: 'aprovada' } });
    candidaturaService.excluir.mockResolvedValue({});
    vagaService.listar.mockResolvedValue(respostaVagas);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('aluno visualiza sua candidatura e pode cadastrar em vaga aberta', async () => {
    render(<Candidaturas />);
    await act(async () => {});

    expect(screen.getByText('Aluno Teste')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Vaga aberta'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar candidatura' }));
    await act(async () => {});

    expect(candidaturaService.cadastrar).toHaveBeenCalledWith({ idVaga: 5 }, 'token-aluno');
  });

  it('pesquisador pode aprovar e rejeitar, mas não recebe formulário de candidatura', async () => {
    sessaoFalsa.usuario = { id: 20, nome: 'Pesquisador', tipo: 'pesquisador' };
    sessaoFalsa.token = 'token-pesquisador';

    render(<Candidaturas />);
    await act(async () => {});

    expect(screen.queryByRole('button', { name: 'Cadastrar candidatura' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }));
    await act(async () => {});

    expect(candidaturaService.atualizar).toHaveBeenCalledWith(
      7,
      5,
      { status: 'aprovada' },
      'token-pesquisador',
    );
  });
});
