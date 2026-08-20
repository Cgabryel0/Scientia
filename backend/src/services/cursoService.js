import * as repositorioCursos from '../models/repositorioCursos.js';

export async function listar() {
  return repositorioCursos.listarTodos();
}
