import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FormularioVaga } from '../paginas/FormularioVaga.jsx';
import * as projetoService from '../servicos/projetoService.js';
import * as vagaService from '../servicos/vagaService.js';

vi.mock('../servicos/projetoService.js', () => ({ listar: vi.fn() }));
vi.mock('../servicos/vagaService.js', () => ({
  buscarPorId: vi.fn(),
  cadastrar: vi.fn(),
  atualizar: vi.fn(),
}));
vi.mock('../contexto/AuthContext.jsx', () => ({
  useAuth: () => ({ token: 'token-pesquisador' }),
}));

describe('Formulário de vaga', () => {
  beforeEach(() => {
    projetoService.listar.mockResolvedValue({ projetos: [{ id: 3, titulo: 'Projeto de IA' }] });
    vagaService.buscarPorId.mockResolvedValue({
      vaga: {
        id: 5,
        titulo: 'Vaga original',
        requisitos: 'Python',
        status: 'aberta',
        qtdVagas: 1,
        dataAbertura: '2026-08-23',
        projeto: { id: 3, titulo: 'Projeto de IA' },
      },
    });
    vagaService.cadastrar.mockResolvedValue({});
    vagaService.atualizar.mockResolvedValue({});
  });

  afterEach(() => vi.clearAllMocks());

  it('cadastra vaga vinculada a projeto', async () => {
    render(
      <MemoryRouter initialEntries={['/vagas/cadastro']}>
        <Routes>
          <Route path="/vagas/cadastro" element={<FormularioVaga />} />
          <Route path="/vagas" element={<p>Lista de vagas</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await act(async () => {});

    fireEvent.change(screen.getByLabelText('Projeto'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Vaga nova' } });
    fireEvent.change(screen.getByLabelText('Data de abertura'), { target: { value: '2026-08-23' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar vaga' }));
    await act(async () => {});

    expect(vagaService.cadastrar).toHaveBeenCalledWith(
      expect.objectContaining({
        idProjeto: 3,
        titulo: 'Vaga nova',
        status: 'aberta',
        qtdVagas: 1,
        dataAbertura: '2026-08-23',
      }),
      'token-pesquisador',
    );
  });

  it('carrega e atualiza vaga existente', async () => {
    render(
      <MemoryRouter initialEntries={['/vagas/5/editar']}>
        <Routes>
          <Route path="/vagas/:id/editar" element={<FormularioVaga />} />
          <Route path="/vagas" element={<p>Lista de vagas</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await act(async () => {});

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'fechada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await act(async () => {});

    expect(vagaService.atualizar).toHaveBeenCalledWith(
      '5',
      expect.objectContaining({ idProjeto: 3, status: 'fechada', qtdVagas: 1 }),
      'token-pesquisador',
    );
  });
});
