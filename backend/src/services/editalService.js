import * as repositorioEditais from '../models/repositorioEditais.js';

export async function listar() {
  return repositorioEditais.listarTodos();
}
