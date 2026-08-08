import { Link } from 'react-router-dom';

import { useAuth } from '../contexto/AuthContext.jsx';

export function Painel() {
  const { usuario } = useAuth();

  return (
    <section className="painel">
      <h1 className="pagina__titulo">Olá, {usuario.nome.split(' ')[0]}!</h1>
      <p className="pagina__descricao">
        Você está autenticado no Scientia. Esta tela só é alcançada com um token válido.
      </p>

      <div className="cartoes">
        <article className="cartao">
          <h2>Seus dados</h2>
          <dl className="lista-dados">
            <dt>Nome</dt>
            <dd>{usuario.nome}</dd>
            <dt>E-mail</dt>
            <dd>{usuario.email}</dd>
            <dt>Papel</dt>
            <dd>
              <span className={`etiqueta etiqueta--${usuario.role.toLowerCase()}`}>
                {usuario.role}
              </span>
            </dd>
          </dl>
        </article>

        <article className="cartao">
          <h2>O que você pode acessar</h2>
          {usuario.role === 'ADMIN' ? (
            <p>
              Como administrador, você também tem acesso à{' '}
              <Link to="/usuarios">lista de usuários</Link> do sistema.
            </p>
          ) : (
            <p>
              Seu perfil consulta o acervo do curso. As telas de administração ficam
              disponíveis apenas para contas com o papel ADMIN.
            </p>
          )}
        </article>
      </div>
    </section>
  );
}
