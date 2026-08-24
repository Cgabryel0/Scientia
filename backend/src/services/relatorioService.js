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
