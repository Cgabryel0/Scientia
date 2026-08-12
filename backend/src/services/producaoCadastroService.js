import { ErroHttp } from '../erros/ErroHttp.js';
import { TIPOS_TRABALHO, novaProducao } from '../models/ProducaoCientifica.js';
import * as repositorio from '../models/repositorioProducoes.js';

const ANO_MINIMO = 1970;

export function cadastrar({
  titulo,
  tipoTrabalho,
  autores,
  resumo,
  palavrasChave,
  anoPublicacao,
  arquivoOuLink,
  criadoPorId,
}) {
  validarDadosDaProducao({
    titulo,
    tipoTrabalho,
    autores,
    resumo,
    palavrasChave,
    anoPublicacao,
    arquivoOuLink,
  });

  const producao = novaProducao({
    titulo: titulo.trim(),
    tipoTrabalho,
    autores: normalizarLista(autores),
    resumo: resumo.trim(),
    palavrasChave: normalizarLista(palavrasChave),
    anoPublicacao: Number(anoPublicacao),
    arquivoOuLink: arquivoOuLink.trim(),
    criadoPorId,
  });

  return repositorio.salvar(producao);
}

function validarDadosDaProducao({
  titulo,
  tipoTrabalho,
  autores,
  resumo,
  palavrasChave,
  anoPublicacao,
  arquivoOuLink,
}) {
  const problemas = [];
  const anoAtual = new Date().getFullYear();

  if (!titulo || !titulo.trim()) {
    problemas.push('Informe o título da produção.');
  }

  if (!TIPOS_TRABALHO.includes(tipoTrabalho)) {
    problemas.push(`O tipo de trabalho deve ser um de: ${TIPOS_TRABALHO.join(', ')}.`);
  }

  if (!Array.isArray(autores) || normalizarLista(autores).length === 0) {
    problemas.push('Informe pelo menos um autor.');
  }

  if (!resumo || !resumo.trim()) {
    problemas.push('Informe um resumo.');
  }

  if (!Array.isArray(palavrasChave) || normalizarLista(palavrasChave).length === 0) {
    problemas.push('Informe pelo menos uma palavra-chave.');
  }

  const ano = Number(anoPublicacao);
  if (!Number.isInteger(ano) || ano < ANO_MINIMO || ano > anoAtual) {
    problemas.push(`O ano de publicação deve estar entre ${ANO_MINIMO} e ${anoAtual}.`);
  }

  if (!arquivoOuLink || !arquivoOuLink.trim()) {
    problemas.push('Informe o arquivo ou endereço eletrônico da produção.');
  }

  if (problemas.length > 0) {
    throw new ErroHttp(400, problemas.join(' '));
  }
}

/** Remove espaços nas pontas e descarta itens vazios ou duplicados de uma lista. */
function normalizarLista(lista) {
  if (!Array.isArray(lista)) {
    return [];
  }

  const itensLimpos = lista.map((item) => String(item ?? '').trim()).filter(Boolean);
  return [...new Set(itensLimpos)];
}
