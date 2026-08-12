/**
 * Recorta a produção científica para o formato que sai da API. Passar sempre
 * por aqui evita que campos internos (como criadoPorId, se um dia virar algo
 * sensível) escapem sem querer em alguma resposta.
 */
export function producaoResposta(producao) {
  return {
    id: producao.id,
    titulo: producao.titulo,
    tipoTrabalho: producao.tipoTrabalho,
    autores: producao.autores,
    resumo: producao.resumo,
    palavrasChave: producao.palavrasChave,
    anoPublicacao: producao.anoPublicacao,
    arquivoOuLink: producao.arquivoOuLink,
    criadoPorId: producao.criadoPorId,
    criadoEm: producao.criadoEm,
  };
}

export function listaDeProducoesResposta(producoes) {
  return producoes.map(producaoResposta);
}
