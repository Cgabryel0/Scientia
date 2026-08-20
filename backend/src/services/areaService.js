import * as repositorioAreas from '../models/repositorioAreas.js';

export async function listar() {
  return repositorioAreas.listarTodas();
}
