import * as repositorioIndicadores from '../models/repositorioIndicadores.js';
import * as repositorioRelatorios from '../models/repositorioRelatorios.js';

export function listarProjetos() {
  return repositorioRelatorios.listarProjetos();
}

export function listarPublicacoes() {
  return repositorioRelatorios.listarPublicacoes();
}

export function listarGrupos() {
  return repositorioRelatorios.listarGrupos();
}

export async function obterIndicadoresProducoes() {
  const indicadores = await repositorioIndicadores.buscarProducoesConsolidadas();
  const maiorQuantidade = indicadores.porArea[0]?.quantidade ?? 0;

  return {
    ...indicadores,
    areasDestaque:
      maiorQuantidade > 0
        ? indicadores.porArea.filter((area) => area.quantidade === maiorQuantidade)
        : [],
  };
}
