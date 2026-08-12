import { ErroHttp } from '../erros/ErroHttp.js';

/**
 * Libera a rota apenas para os papéis informados. Roda depois do filtro de
 * autenticação, que é quem coloca o usuário do token no request.
 */
export function exigeRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      throw new ErroHttp(401, 'É preciso estar autenticado para acessar este recurso.');
    }

    if (!rolesPermitidos.includes(req.usuario.role)) {
      throw new ErroHttp(403, 'Seu perfil não tem permissão para acessar este recurso.');
    }

    next();
  };
}
