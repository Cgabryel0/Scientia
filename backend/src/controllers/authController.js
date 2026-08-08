import { usuarioResposta } from '../dto/usuarioDTO.js';
import { gerarToken, revogarToken } from '../services/tokenService.js';
import * as usuarioService from '../services/usuarioService.js';

export async function cadastrar(req, res) {
  const { nome, email, senha, role } = req.body ?? {};
  const usuario = await usuarioService.cadastrar({ nome, email, senha, role });

  res.status(201).json({
    usuario: usuarioResposta(usuario),
    token: gerarToken(usuario),
  });
}

export async function login(req, res) {
  const { email, senha } = req.body ?? {};
  const usuario = await usuarioService.autenticar(email, senha);

  res.json({
    usuario: usuarioResposta(usuario),
    token: gerarToken(usuario),
  });
}

export function logout(req, res) {
  revogarToken(req.usuario);
  res.json({ mensagem: 'Sessão encerrada.' });
}

/** Usado pelo frontend para saber de quem é o token guardado no navegador. */
export function perfil(req, res) {
  const usuario = usuarioService.buscarPorId(req.usuario.sub);
  res.json({ usuario: usuarioResposta(usuario) });
}
