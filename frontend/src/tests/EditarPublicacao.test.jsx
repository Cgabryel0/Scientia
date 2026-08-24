import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EditarPublicacao } from '../paginas/EditarPublicacao.jsx';
import * as projetoService from '../servicos/projetoService.js';
import * as publicacaoService from '../servicos/publicacaoService.js';

vi.mock('../servicos/projetoService.js', () => ({
  listar: vi.fn(),
}));

vi.mock('../servicos/publicacaoService.js', () => ({
  buscarPorId: vi.fn(),
  atualizar: vi.fn(),
}));

vi.mock('../contexto/AuthContext.jsx', () => ({
  useAuth: () => ({ token: 'token-pesquisador' }),
}));

vi.mock('../componentes/AutoresPesquisadorInput.jsx', () => ({
  AutoresPesquisadorInput: ({ aoAlterar }) => (
    <button
      type="button"
      onClick={() =>
        aoAlterar([
          { id: 91 },
          {
            nome: 'Autora Nova',
            numeroLattes: '9999999999999999',
            vinculo: 'docente',
            email: 'nova@ufape.edu.br',
          },
        ])
      }
    >
      Definir autores
    </button>
  ),
}));

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/publicacoes/1/editar']}>
      <Routes>
        <Route path="/publicacoes/:id/editar" element={<EditarPublicacao />} />
        <Route path="/publicacoes" element={<p>Lista de publicações</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Edição de publicação', () => {
  beforeEach(() => {
    publicacaoService.buscarPorId.mockResolvedValue({
      publicacao: {
        id: 1,
        titulo: 'Publicação original',
        tipo: 'artigo',
        ano: 2025,
        doi: '10.1000/original',
        veiculo: 'Revista Original',
        projeto: { id: 3, titulo: 'Projeto de IA' },
        autores: [{ id: 91, nome: 'Autora Existente', ordem: 1 }],
      },
    });
    projetoService.listar.mockResolvedValue({
      projetos: [{ id: 3, titulo: 'Projeto de IA' }],
    });
    publicacaoService.atualizar.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('preserva autor existente e envia todos os dados de um autor novo no PUT', async () => {
    renderizar();
    await act(async () => {});

    fireEvent.click(screen.getByRole('button', { name: 'Definir autores' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await act(async () => {});

    expect(publicacaoService.atualizar).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        autores: [
          { id: 91 },
          {
            nome: 'Autora Nova',
            numeroLattes: '9999999999999999',
            vinculo: 'docente',
            email: 'nova@ufape.edu.br',
          },
        ],
      }),
      'token-pesquisador',
    );
    expect(screen.getByText('Lista de publicações')).toBeInTheDocument();
  });
});
