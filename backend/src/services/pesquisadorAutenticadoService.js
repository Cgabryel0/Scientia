import { ErroHttp } from '../erros/ErroHttp.js';
import * as repositorioPesquisadores from '../models/repositorioPesquisadores.js';

export async function resolverPesquisadorAutenticado(usuario, executor) {
  if (usuario?.tipo === 'admin') {
    return null;
  }

  const pesquisador = await repositorioPesquisadores.buscarPorIdConta(Number(usuario?.sub), executor);

  if (!pesquisador) {
    throw new ErroHttp(403, 'Sua conta não está vinculada a um pesquisador.');
  }

  return pesquisador;
}
