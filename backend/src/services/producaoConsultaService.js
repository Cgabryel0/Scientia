import * as repositorio from '../models/repositorioProducoes.js';
import { listaDeProducoesResposta } from '../dto/producaoDTO.js';

export const aplicarFiltros = (producoes, filtros) => {
  return producoes.filter((producao) => {
    let match = true;

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

export const listar = async (filtros) => {
  const todasProducoes = await repositorio.listarTodos();
  const producoesFiltradas = aplicarFiltros(todasProducoes, filtros);
  
  producoesFiltradas.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  
  return listaDeProducoesResposta(producoesFiltradas);
};
