import { ErroHttp } from '../erros/ErroHttp.js';

export function exigeTipo(...tiposPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      throw new ErroHttp(401, 'É preciso estar autenticado para acessar este recurso.');
    }

    if (!tiposPermitidos.includes(req.usuario.tipo)) {
      throw new ErroHttp(403, 'Seu perfil não tem permissão para acessar este recurso.');
    }

    next();
  };
}
