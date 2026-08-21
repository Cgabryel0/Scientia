import { ROTULOS_TIPO, ROTULOS_VINCULO } from './acervo.js';

export const ANO_MINIMO = 1950;
export const ANO_MAXIMO = 2100;

export const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TIPOS_PUBLICACAO = Object.keys(ROTULOS_TIPO);
const VINCULOS_PESQUISADOR = Object.keys(ROTULOS_VINCULO);

export function validarPublicacao(publicacao) {
  const problemas = [];
  const titulo = texto(publicacao.titulo);
  const veiculo = texto(publicacao.veiculo);
  const doi = texto(publicacao.doi);

  if (!titulo) {
    problemas.push('Informe o título.');
  } else if (titulo.length > 255) {
    problemas.push('O título deve ter no máximo 255 caracteres.');
  }

  if (!TIPOS_PUBLICACAO.includes(publicacao.tipo)) {
    problemas.push('O tipo deve ser artigo, capítulo ou resumo.');
  }

  if (!Number.isInteger(publicacao.ano) || publicacao.ano < ANO_MINIMO || publicacao.ano > ANO_MAXIMO) {
    problemas.push(`O ano deve ser um número inteiro entre ${ANO_MINIMO} e ${ANO_MAXIMO}.`);
  }

  if (!veiculo) {
    problemas.push('Informe o veículo.');
  } else if (veiculo.length > 150) {
    problemas.push('O veículo deve ter no máximo 150 caracteres.');
  }

  if (doi.length > 100) {
    problemas.push('O DOI deve ter no máximo 100 caracteres.');
  }

  if (!Number.isInteger(publicacao.idProjeto) || publicacao.idProjeto < 1) {
    problemas.push('Informe um projeto válido.');
  }

  validarAutores(publicacao.autores, problemas);

  return problemas;
}

function validarAutores(autores, problemas) {
  if (!Array.isArray(autores) || autores.length === 0) {
    problemas.push('Informe ao menos um autor.');
    return;
  }

  const identificadores = new Set();

  for (const autor of autores) {
    const ehExistente = autor.id !== undefined && autor.id !== null;
    const nome = texto(autor.nome);
    const numeroLattes = texto(autor.numeroLattes);

    if (ehExistente === Boolean(nome || numeroLattes || autor.vinculo)) {
      problemas.push('Informe um autor existente ou os dados de um autor novo.');
      continue;
    }

    if (ehExistente) {
      if (!Number.isInteger(autor.id) || autor.id < 1) {
        problemas.push('Informe um autor existente ou os dados de um autor novo.');
        continue;
      }

      if (identificadores.has(`id:${autor.id}`)) {
        problemas.push('Não repita o mesmo autor na lista.');
      }

      identificadores.add(`id:${autor.id}`);
      continue;
    }

    if (!nome || !numeroLattes || !VINCULOS_PESQUISADOR.includes(autor.vinculo)) {
      problemas.push('Informe um autor existente ou os dados de um autor novo.');
      continue;
    }

    if (nome.length > 150) {
      problemas.push('O nome do autor deve ter no máximo 150 caracteres.');
    }

    if (numeroLattes.length > 50) {
      problemas.push('O número Lattes deve ter no máximo 50 caracteres.');
    }

    const email = texto(autor.email);

    if (email && !FORMATO_EMAIL.test(email)) {
      problemas.push('Informe um email válido para o autor novo.');
    }

    if (email.length > 150) {
      problemas.push('O email do autor deve ter no máximo 150 caracteres.');
    }

    if (identificadores.has(`lattes:${numeroLattes}`)) {
      problemas.push('Não repita o mesmo autor na lista.');
    }

    identificadores.add(`lattes:${numeroLattes}`);
  }
}

function texto(valor) {
  return String(valor ?? '').trim();
}
