import { ErroHttp } from '../erros/ErroHttp.js';
import { TIPOS_TRABALHO } from '../models/ProducaoCientifica.js';
import * as repositorio from '../models/repositorioProducoes.js';

/**
 * Consulta do acervo. Os três filtros são opcionais e combináveis: quem não
 * manda filtro nenhum recebe o acervo inteiro, do mais recente para o mais
 * antigo.
 */
export function listar({ busca, tipoTrabalho, anoPublicacao } = {}) {
  validarFiltros({ tipoTrabalho, anoPublicacao });

  let resultado = repositorio.listarTodos();

  if (tipoTrabalho) {
    resultado = resultado.filter((producao) => producao.tipoTrabalho === tipoTrabalho);
  }

  if (anoPublicacao) {
    resultado = resultado.filter((producao) => producao.anoPublicacao === Number(anoPublicacao));
  }

  if (busca && busca.trim()) {
    const termo = busca.trim().toLowerCase();
    resultado = resultado.filter((producao) => combinaComTermo(producao, termo));
  }

  return ordenarPorMaisRecentes(resultado);
}

/** A busca textual olha título, autores e palavras-chave, sem diferenciar maiúsculas. */
function combinaComTermo(producao, termo) {
  const campos = [producao.titulo, ...producao.autores, ...producao.palavrasChave];
  return campos.some((campo) => campo.toLowerCase().includes(termo));
}

function validarFiltros({ tipoTrabalho, anoPublicacao }) {
  const problemas = [];

  if (tipoTrabalho && !TIPOS_TRABALHO.includes(tipoTrabalho)) {
    problemas.push(`O tipo de trabalho deve ser um de: ${TIPOS_TRABALHO.join(', ')}.`);
  }

  if (anoPublicacao && !Number.isInteger(Number(anoPublicacao))) {
    problemas.push('O ano de publicação deve ser um número inteiro.');
  }

  if (problemas.length > 0) {
    throw new ErroHttp(400, problemas.join(' '));
  }
}

/** Ano de publicação mais novo primeiro; dentro do mesmo ano, o cadastro mais recente. */
function ordenarPorMaisRecentes(producoes) {
  return [...producoes].sort((a, b) => {
    if (b.anoPublicacao !== a.anoPublicacao) {
      return b.anoPublicacao - a.anoPublicacao;
    }
    return b.criadoEm.localeCompare(a.criadoEm);
  });
}
