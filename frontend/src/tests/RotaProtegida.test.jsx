import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RotaProtegida } from '../componentes/RotaProtegida.jsx';

// O guard lê a sessão pelo useAuth; aqui trocamos o hook por um dublê que cada
// teste configura antes de renderizar.
const sessaoFalsa = { usuario: null, carregando: false };

vi.mock('../contexto/AuthContext.jsx', () => ({
  useAuth: () => sessaoFalsa,
}));

/** Mostra para onde o guard redirecionou e o destino guardado no state. */
function TelaDeLogin() {
  const local = useLocation();
  return <p>Tela de login | destino: {local.state?.destino}</p>;
}

function renderizarRotaPrivada(tipos) {
  return render(
    <MemoryRouter initialEntries={['/privada']}>
      <Routes>
        <Route path="/login" element={<TelaDeLogin />} />
        <Route path="/sem-permissao" element={<p>Acesso negado</p>} />
        <Route element={<RotaProtegida tipos={tipos} />}>
          <Route path="/privada" element={<p>Conteúdo privado</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RotaProtegida', () => {
  beforeEach(() => {
    sessaoFalsa.usuario = null;
    sessaoFalsa.carregando = false;
  });

  it('mostra a verificação de sessão enquanto o contexto carrega', () => {
    sessaoFalsa.carregando = true;

    renderizarRotaPrivada();

    expect(screen.getByText(/verificando sua sessão/i)).toBeInTheDocument();
  });

  it('sem sessão, redireciona para o login guardando o destino interrompido', () => {
    renderizarRotaPrivada();

    expect(screen.getByText(/tela de login/i)).toBeInTheDocument();
    // O login usa esse destino para devolver o usuário aonde ele queria ir.
    expect(screen.getByText(/destino: \/privada/)).toBeInTheDocument();
  });

  it('com sessão de aluno numa rota de admin, redireciona para acesso negado', () => {
    sessaoFalsa.usuario = { id: 152, nome: 'Ana Souza', email: 'ana@ufape.edu.br', tipo: 'aluno', criadoEm: '2026-08-19T12:00:00.000Z' };

    renderizarRotaPrivada(['admin']);

    expect(screen.getByText(/acesso negado/i)).toBeInTheDocument();
  });

  it('com sessão e tipo adequado, renderiza o conteúdo da rota', () => {
    sessaoFalsa.usuario = { id: 1, nome: 'Fulana', email: 'fulana@ufape.edu.br', tipo: 'admin', criadoEm: '2026-08-19T12:00:00.000Z' };

    renderizarRotaPrivada(['admin']);

    expect(screen.getByText(/conteúdo privado/i)).toBeInTheDocument();
  });
});
