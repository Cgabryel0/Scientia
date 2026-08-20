import { listaDeUsuariosResposta } from '../dto/usuarioDTO.js';
import * as usuarioService from '../services/usuarioService.js';

export async function listar(req, res) {
  const usuarios = await usuarioService.listar();
  res.json({ usuarios: listaDeUsuariosResposta(usuarios) });
}
