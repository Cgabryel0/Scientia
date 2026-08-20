import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../contexto/AuthContext.jsx';

/**
 * Guard das rotas. Sem sessão válida devolve o visitante para o login; com
 * sessão, mas sem o tipo exigido pela rota, manda para a tela de acesso negado.
 */
export function RotaProtegida({ tipos }) {
  const { usuario, carregando } = useAuth();
  const local = useLocation();

  if (carregando) {
    return <p className="aviso-carregando">Verificando sua sessão...</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" state={{ destino: local.pathname }} replace />;
  }

  if (tipos && !tipos.includes(usuario.tipo)) {
    return <Navigate to="/sem-permissao" replace />;
  }

  return <Outlet />;
}
