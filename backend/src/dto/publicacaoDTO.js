export function publicacaoResposta(publicacao) {
  return {
    id: publicacao.id,
    titulo: publicacao.titulo,
    tipo: publicacao.tipo,
    ano: publicacao.ano,
    doi: publicacao.doi,
    veiculo: publicacao.veiculo,
    projeto: publicacao.projeto,
    autores: publicacao.autores,
  };
}

export function listaDePublicacoesResposta(publicacoes) {
  return publicacoes.map(publicacaoResposta);
}
