export function vagaResposta(vaga) {
  return {
    id: vaga.id,
    titulo: vaga.titulo,
    requisitos: vaga.requisitos,
    status: vaga.status,
    qtdVagas: vaga.qtdVagas,
    dataAbertura: vaga.dataAbertura,
    projeto: vaga.projeto,
    totalCandidaturas: vaga.totalCandidaturas,
  };
}

export function listaDeVagasResposta(vagas) {
  return vagas.map(vagaResposta);
}
