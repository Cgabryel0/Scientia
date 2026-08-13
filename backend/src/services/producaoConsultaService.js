import { listaDeProducoesResposta } from '../dto/producaoDTO.js';
import { ErroHttp } from '../erros/ErroHttp.js';
import { TIPOS_TRABALHO } from '../models/ProducaoCientifica.js';
import * as repositorio from '../models/repositorioProducoes.js';

export const aplicarFiltros = (producoes, filtros) => {
  return producoes.filter((producao) => {
    let match = true;

    // Busca unificada: casa com título, autores ou palavras-chave.
    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      const campos = [producao.titulo, ...producao.autores, ...producao.palavrasChave];
      if (!campos.some((campo) => campo.toLowerCase().includes(termo))) {
        match = false;
      }
    }

    if (filtros.titulo && !producao.titulo.toLowerCase().includes(filtros.titulo.toLowerCase())) {
      match = false;
    }

    if (filtros.autor && !producao.autores.some(a => a.toLowerCase().includes(filtros.autor.toLowerCase()))) {
      match = false;
    }

    if (filtros.tipoTrabalho && producao.tipoTrabalho !== filtros.tipoTrabalho) {
      match = false;
    }

    if (filtros.palavraChave && !producao.palavrasChave.some(p => p.toLowerCase().includes(filtros.palavraChave.toLowerCase()))) {
      match = false;
    }

    if (filtros.anoPublicacao && producao.anoPublicacao !== Number(filtros.anoPublicacao)) {
      match = false;
    }

    return match;
  });
};

const validarFiltros = (filtros) => {
  const problemas = [];

  if (filtros.tipoTrabalho && !TIPOS_TRABALHO.includes(filtros.tipoTrabalho)) {
    problemas.push(`O tipo de trabalho deve ser um de: ${TIPOS_TRABALHO.join(', ')}.`);
  }

  if (filtros.anoPublicacao && !Number.isInteger(Number(filtros.anoPublicacao))) {
    problemas.push('O ano de publicação deve ser um número inteiro.');
  }

  if (problemas.length > 0) {
    throw new ErroHttp(400, problemas.join(' '));
  }
};

export const listar = async (filtros) => {
  validarFiltros(filtros);

  const todasProducoes = await repositorio.listarTodos();
  const producoesFiltradas = aplicarFiltros(todasProducoes, filtros);

  // Ano de publicação mais novo primeiro; dentro do mesmo ano, o cadastro mais recente.
  producoesFiltradas.sort(
    (a, b) => b.anoPublicacao - a.anoPublicacao || new Date(b.criadoEm) - new Date(a.criadoEm)
  );

  return listaDeProducoesResposta(producoesFiltradas);
};
