export function pesquisadorResposta(pesquisador) {
  return {
    id: pesquisador.id,
    nome: pesquisador.nome,
    vinculo: pesquisador.vinculo,
    numeroLattes: pesquisador.numeroLattes,
    totalPublicacoes: pesquisador.totalPublicacoes,
  };
}

export function listaDePesquisadoresResposta(pesquisadores) {
  return pesquisadores.map(pesquisadorResposta);
}
