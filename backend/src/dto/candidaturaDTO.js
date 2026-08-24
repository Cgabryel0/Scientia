export function candidaturaResposta(candidatura) {
  return {
    aluno: candidatura.aluno,
    vaga: candidatura.vaga,
    status: candidatura.status,
    dataCandidatura: candidatura.dataCandidatura,
  };
}

export function listaDeCandidaturasResposta(candidaturas) {
  return candidaturas.map(candidaturaResposta);
}
