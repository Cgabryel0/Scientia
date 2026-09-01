import * as relatorioService from '../services/relatorioService.js';

export async function projetos(req, res) {
  res.json({ projetos: await relatorioService.listarProjetos() });
}

export async function publicacoes(req, res) {
  res.json({ publicacoes: await relatorioService.listarPublicacoes() });
}

export async function grupos(req, res) {
  res.json({ grupos: await relatorioService.listarGrupos() });
}

export async function indicadoresProducoes(req, res) {
  res.json({ indicadores: await relatorioService.obterIndicadoresProducoes() });
}
