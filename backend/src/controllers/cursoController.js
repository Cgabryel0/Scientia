import { listaDeCursosResposta } from '../dto/cursoDTO.js';
import * as cursoService from '../services/cursoService.js';

export async function listar(req, res) {
  const cursos = await cursoService.listar();
  res.json({ cursos: listaDeCursosResposta(cursos) });
}
