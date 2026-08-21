export function editalResposta(edital) {
  return {
    id: edital.id,
    nome: edital.nome,
    ano: edital.ano,
  };
}

export function listaDeEditaisResposta(editais) {
  return editais.map(editalResposta);
}
