import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cabecalho } from '../componentes/Cabecalho.jsx';

const sessaoFalsa = { usuario: null, sair: vi.fn() };

vi.mock('../contexto/AuthContext.jsx', () => ({
  useAuth: () => sessaoFalsa,
}));

function renderizarCabecalho() {
  return render(
    <MemoryRouter>
      <Cabecalho />
    </MemoryRouter>,
  );
}

describe('Cabeçalho do hub', () => {
  beforeEach(() => {
    sessaoFalsa.usuario = null;
  });

  it('sem sessão, mostra os links do acervo e o convite para entrar', () => {
    renderizarCabecalho();

    expect(screen.getByRole('link', { name: 'Publicações' })).toHaveAttribute(
      'href',
      '/publicacoes',
    );
    expect(screen.getByRole('link', { name: 'Projetos' })).toHaveAttribute('href', '/projetos');
    expect(screen.getByRole('link', { name: 'Grupos' })).toHaveAttribute('href', '/grupos');
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: /sair/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Painel' })).not.toBeInTheDocument();
  });

  it('com sessão de admin, mostra o menu da conta e o link de usuários', () => {
    sessaoFalsa.usuario = { id: 1, nome: 'Ana Souza', email: 'ana@ufape.edu.br', tipo: 'admin' };

    renderizarCabecalho();

    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Painel' })).toHaveAttribute('href', '/painel');
    expect(screen.getByRole('link', { name: 'Usuários' })).toHaveAttribute('href', '/usuarios');
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
  });

  it('com sessão de aluno, esconde o link de usuários', () => {
    sessaoFalsa.usuario = { id: 2, nome: 'Bruno Lima', email: 'bruno@ufape.edu.br', tipo: 'aluno' };

    renderizarCabecalho();

    expect(screen.queryByRole('link', { name: 'Usuários' })).not.toBeInTheDocument();
  });
});
