import { listaDeUsuariosResposta } from '../dto/usuarioDTO.js';
import * as usuarioService from '../services/usuarioService.js';

export function listar(req, res) {
  res.json({ usuarios: listaDeUsuariosResposta(usuarioService.listar()) });
}
