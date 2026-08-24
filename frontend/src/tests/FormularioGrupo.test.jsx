import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FormularioGrupo } from '../paginas/FormularioGrupo.jsx';
import * as grupoService from '../servicos/grupoService.js';

vi.mock('../servicos/grupoService.js', () => ({
  buscarPorId: vi.fn(),
  cadastrar: vi.fn(),
  atualizar: vi.fn(),
}));
vi.mock('../contexto/AuthContext.jsx', () => ({
  useAuth: () => ({ token: 'token-pesquisador' }),
}));

describe('Formulário de grupo', () => {
  beforeEach(() => {
    grupoService.buscarPorId.mockResolvedValue({
      grupo: { id: 2, nome: 'Grupo original', linkDgp: null, anoCriacao: 2020 },
    });
    grupoService.cadastrar.mockResolvedValue({ grupo: { id: 7 } });
    grupoService.atualizar.mockResolvedValue({ grupo: { id: 2 } });
  });

  afterEach(() => vi.clearAllMocks());

  it('cadastra grupo com os tipos esperados', async () => {
    render(
      <MemoryRouter initialEntries={['/grupos/cadastro']}>
        <Routes>
          <Route path="/grupos/cadastro" element={<FormularioGrupo />} />
          <Route path="/grupos/:id" element={<p>Grupo salvo</p>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Novo grupo' } });
    fireEvent.change(screen.getByLabelText('Ano de criação'), { target: { value: '2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar grupo' }));
    await act(async () => {});

    expect(grupoService.cadastrar).toHaveBeenCalledWith(
      { nome: 'Novo grupo', linkDgp: null, anoCriacao: 2026 },
      'token-pesquisador',
    );
  });

  it('carrega e atualiza grupo existente', async () => {
    render(
      <MemoryRouter initialEntries={['/grupos/2/editar']}>
        <Routes>
          <Route path="/grupos/:id/editar" element={<FormularioGrupo />} />
          <Route path="/grupos/:id" element={<p>Grupo salvo</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await act(async () => {});

    expect(screen.getByDisplayValue('Grupo original')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await act(async () => {});

    expect(grupoService.atualizar).toHaveBeenCalledWith(
      '2',
      { nome: 'Grupo original', linkDgp: null, anoCriacao: 2020 },
      'token-pesquisador',
    );
  });
});
