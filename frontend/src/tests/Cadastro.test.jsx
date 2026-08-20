import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cadastro } from '../paginas/Cadastro.jsx';
import * as cursoService from '../servicos/cursoService.js';

vi.mock('../servicos/cursoService.js', () => ({
  listar: vi.fn(),
}));

const contextoFalso = { usuario: null, registrar: vi.fn() };

vi.mock('../contexto/AuthContext.jsx', () => ({
  useAuth: () => contextoFalso,
}));

const cursosFalsos = [
  { id: 1, nome: 'Ciência da Computação' },
  { id: 2, nome: 'Engenharia de Software' },
];

function renderizarTela() {
  return render(
    <MemoryRouter>
      <Cadastro />
    </MemoryRouter>,
  );
}

describe('Tela de cadastro', () => {
  beforeEach(() => {
    contextoFalso.usuario = null;
    contextoFalso.registrar = vi.fn().mockResolvedValue();
    cursoService.listar.mockResolvedValue({ cursos: cursosFalsos });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('parte com o tipo aluno selecionado e mostra matrícula e curso', async () => {
    renderizarTela();
    await act(async () => {});

    expect(screen.getByLabelText(/matrícula/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/curso/i)).toBeInTheDocument();
    expect(screen.getByText('Ciência da Computação')).toBeInTheDocument();
    expect(screen.queryByLabelText(/número lattes/i)).not.toBeInTheDocument();
  });

  it('trocando o tipo para pesquisador, mostra número Lattes e vínculo', async () => {
    renderizarTela();
    await act(async () => {});

    fireEvent.change(screen.getByLabelText(/tipo de conta/i), { target: { value: 'pesquisador' } });

    expect(screen.getByLabelText(/número lattes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/vínculo/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/matrícula/i)).not.toBeInTheDocument();
  });

  it('envia o cadastro de aluno com os campos do contrato do backend', async () => {
    renderizarTela();
    await act(async () => {});

    fireEvent.change(screen.getByLabelText(/^nome$/i), { target: { value: 'Ana Souza' } });
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'ana@ufape.edu.br' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'segredo123' } });
    fireEvent.change(screen.getByLabelText(/matrícula/i), { target: { value: '20230001' } });
    fireEvent.change(screen.getByLabelText(/curso/i), { target: { value: '1' } });

    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    await act(async () => {});

    expect(contextoFalso.registrar).toHaveBeenCalledWith({
      tipo: 'aluno',
      nome: 'Ana Souza',
      email: 'ana@ufape.edu.br',
      senha: 'segredo123',
      matricula: '20230001',
      idCurso: '1',
    });
  });

  it('envia o cadastro de pesquisador com os campos do contrato do backend', async () => {
    renderizarTela();
    await act(async () => {});

    fireEvent.change(screen.getByLabelText(/tipo de conta/i), { target: { value: 'pesquisador' } });
    fireEvent.change(screen.getByLabelText(/^nome$/i), { target: { value: 'Carlos Lima' } });
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'carlos@ufape.edu.br' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'segredo123' } });
    fireEvent.change(screen.getByLabelText(/número lattes/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/vínculo/i), { target: { value: 'externo' } });

    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    await act(async () => {});

    expect(contextoFalso.registrar).toHaveBeenCalledWith({
      tipo: 'pesquisador',
      nome: 'Carlos Lima',
      email: 'carlos@ufape.edu.br',
      senha: 'segredo123',
      numeroLattes: '1234567890',
      vinculo: 'externo',
    });
  });

  it('mostra a mensagem de erro devolvida pelo backend', async () => {
    contextoFalso.registrar = vi.fn().mockRejectedValue(new Error('Já existe uma conta com esse email.'));

    renderizarTela();
    await act(async () => {});

    fireEvent.change(screen.getByLabelText(/^nome$/i), { target: { value: 'Ana Souza' } });
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'ana@ufape.edu.br' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'segredo123' } });
    fireEvent.change(screen.getByLabelText(/matrícula/i), { target: { value: '20230001' } });
    fireEvent.change(screen.getByLabelText(/curso/i), { target: { value: '1' } });

    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    await act(async () => {});

    expect(screen.getByText(/já existe uma conta com esse email/i)).toBeInTheDocument();
  });
});
