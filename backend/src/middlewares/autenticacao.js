import { rotaEhPublica } from '../config/seguranca.js';
import { ErroHttp } from '../erros/ErroHttp.js';
import { validarToken } from '../services/tokenService.js';

/**
 * Filtro por onde passa toda requisição da API: as rotas públicas seguem
 * direto e as demais só continuam com um token válido no cabeçalho
 * Authorization. O que veio dentro do token fica em req.usuario para os
 * controllers e para a checagem de papel.
 */
export function autenticacao(req, res, next) {
  if (rotaEhPublica(req.method, req.path)) {
    return next();
  }

  const [esquema, token] = (req.get('authorization') ?? '').split(' ');
  if (esquema !== 'Bearer' || !token) {
    throw new ErroHttp(401, 'Envie o token de acesso no cabeçalho Authorization.');
  }

  req.usuario = validarToken(token);
  next();
}
