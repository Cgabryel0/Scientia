import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EditarProjeto } from '../paginas/EditarProjeto.jsx';
import * as areaService from '../servicos/areaService.js';
import * as editalService from '../servicos/editalService.js';
import * as grupoService from '../servicos/grupoService.js';
import * as projetoService from '../servicos/projetoService.js';

vi.mock('../servicos/areaService.js', () => ({ listar: vi.fn() }));
vi.mock('../servicos/editalService.js', () => ({ listar: vi.fn() }));
vi.mock('../servicos/grupoService.js', () => ({ listar: vi.fn() }));
vi.mock('../servicos/projetoService.js', () => ({
  buscarPorId: vi.fn(),
  atualizar: vi.fn(),
}));
vi.mock('../contexto/AuthContext.jsx', () => ({
  useAuth: () => ({ token: 'token-pesquisador' }),
}));

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/projetos/3/editar']}>
      <Routes>
        <Route path="/projetos/:id/editar" element={<EditarProjeto />} />
        <Route path="/projetos/:id" element={<p>Detalhe salvo</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Edição de projeto', () => {
  beforeEach(() => {
    projetoService.buscarPorId.mockResolvedValue({
      projeto: {
        id: 3,
        titulo: 'Projeto original',
        resumo: 'Resumo',
        dataInicio: '2025-01-10',
        dataFim: null,
        status: 'em_andamento',
        grupo: { id: 2, nome: 'Grupo' },
        edital: null,
        areas: [{ id: 1, nome: 'Computação' }],
      },
    });
    grupoService.listar.mockResolvedValue({ grupos: [{ id: 2, nome: 'Grupo' }] });
    areaService.listar.mockResolvedValue({ areas: [{ id: 1, nome: 'Computação' }] });
    editalService.listar.mockResolvedValue({ editais: [{ id: 4, nome: 'Edital', ano: 2026 }] });
    projetoService.atualizar.mockResolvedValue({});
  });

  afterEach(() => vi.clearAllMocks());

  it('carrega dados e envia PUT com grupo, edital e áreas normalizados', async () => {
    renderizar();
    await act(async () => {});

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Projeto atualizado' } });
    fireEvent.change(screen.getByLabelText('Edital'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await act(async () => {});

    expect(projetoService.atualizar).toHaveBeenCalledWith(
      '3',
      expect.objectContaining({
        titulo: 'Projeto atualizado',
        idGrupo: 2,
        idEdital: 4,
        areas: [1],
      }),
      'token-pesquisador',
    );
    expect(screen.getByText('Detalhe salvo')).toBeInTheDocument();
  });
});
