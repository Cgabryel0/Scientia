import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';

import { JWT_EXPIRACAO, JWT_SECRET } from '../config/ambiente.js';
import { ErroHttp } from '../erros/ErroHttp.js';

/**
 * Tokens invalidados no logout, guardados como jti -> instante de expiração.
 * Um JWT sozinho continua valendo até vencer, então sem essa lista o logout não
 * passaria de apagar o token no navegador.
 */
const revogados = new Map();

export function gerarToken(usuario) {
  const conteudo = {
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
  };

  return jwt.sign(conteudo, JWT_SECRET, {
    subject: usuario.id,
    jwtid: randomUUID(),
    expiresIn: JWT_EXPIRACAO,
  });
}

export function validarToken(token) {
  let conteudo;
  try {
    conteudo = jwt.verify(token, JWT_SECRET);
  } catch (erro) {
    const expirou = erro.name === 'TokenExpiredError';
    throw new ErroHttp(401, expirou ? 'Sua sessão expirou, entre novamente.' : 'Token inválido.');
  }

  if (revogados.has(conteudo.jti)) {
    throw new ErroHttp(401, 'Token já foi encerrado no logout.');
  }

  return conteudo;
}

export function revogarToken(conteudo) {
  revogados.set(conteudo.jti, conteudo.exp);
  descartarVencidos();
}

// Depois que o token vence ele já é recusado na verificação da assinatura,
// então manter o jti na lista só ocuparia memória à toa.
function descartarVencidos() {
  const agora = Math.floor(Date.now() / 1000);
  for (const [jti, expiraEm] of revogados) {
    if (expiraEm <= agora) {
      revogados.delete(jti);
    }
  }
}
