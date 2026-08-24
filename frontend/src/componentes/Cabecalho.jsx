import { Link, NavLink, useNavigate } from 'react-router-dom';

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
      <Link to="/publicacoes" className="cabecalho__marca">
        <span className="cabecalho__logo">S</span>
        <div>
          <strong>Scientia</strong>
          <small>Hub de Produção Científica do BCC</small>
        </div>
      </Link>

      <nav className="cabecalho__menu">
        <NavLink to="/publicacoes">Publicações</NavLink>
        <NavLink to="/projetos">Projetos</NavLink>
        <NavLink to="/grupos">Grupos</NavLink>
        <NavLink to="/vagas">Vagas</NavLink>
        <NavLink to="/relatorios">Relatórios</NavLink>
        {usuario && <NavLink to="/painel">Painel</NavLink>}
        {usuario && <NavLink to="/candidaturas">Candidaturas</NavLink>}
        {/* O link só aparece para o admin, mas quem barra o acesso de verdade
            é o guard da rota e o backend. */}
        {usuario?.tipo === 'admin' && <NavLink to="/usuarios">Usuários</NavLink>}
      </nav>

      {usuario ? (
        <div className="cabecalho__usuario">
          <span className="cabecalho__nome">{usuario.nome}</span>
          <span className={`etiqueta etiqueta--${usuario.tipo}`}>{usuario.tipo}</span>
          <button type="button" className="botao botao--discreto" onClick={encerrarSessao}>
            Sair
          </button>
        </div>
      ) : (
        <div className="cabecalho__usuario">
          <Link to="/login" className="botao botao--primario botao--compacto">
            Entrar
          </Link>
        </div>
      )}
    </header>
  );
}
