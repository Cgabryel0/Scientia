import { NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexto/AuthContext.jsx';

export function Cabecalho() {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();

  async function encerrarSessao() {
    await sair();
    navegar('/login', { replace: true });
  }

  return (
    <header className="cabecalho">
      <div className="cabecalho__marca">
        <span className="cabecalho__logo">S</span>
        <div>
          <strong>Scientia</strong>
          <small>Hub de Produção Científica do BCC</small>
        </div>
      </div>

      <nav className="cabecalho__menu">
        <NavLink to="/painel">Painel</NavLink>
        {/* O link só aparece para o ADMIN, mas quem barra o acesso de verdade
            é o guard da rota e o backend. */}
        {usuario.role === 'ADMIN' && <NavLink to="/usuarios">Usuários</NavLink>}
      </nav>

      <div className="cabecalho__usuario">
        <span className="cabecalho__nome">{usuario.nome}</span>
        <span className={`etiqueta etiqueta--${usuario.role.toLowerCase()}`}>{usuario.role}</span>
        <button type="button" className="botao botao--discreto" onClick={encerrarSessao}>
          Sair
        </button>
      </div>
    </header>
  );
}
