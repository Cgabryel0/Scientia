import { usuarioComPerfilResposta, usuarioResposta } from '../dto/usuarioDTO.js';
import { gerarToken, revogarToken } from '../services/tokenService.js';
import * as usuarioService from '../services/usuarioService.js';

export async function cadastrar(req, res) {
  const usuario = await usuarioService.cadastrar(req.body ?? {});

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

export async function perfil(req, res) {
  const usuario = await usuarioService.buscarPerfilPorId(req.usuario.sub);
  res.json({ usuario: usuarioComPerfilResposta(usuario) });
}
