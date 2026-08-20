export function grupoResumoResposta(grupo) {
  return {
    id: grupo.id,
    nome: grupo.nome,
    linkDgp: grupo.linkDgp,
    anoCriacao: grupo.anoCriacao,
    totalProjetos: grupo.totalProjetos,
    totalMembros: grupo.totalMembros,
  };
}

export function grupoDetalheResposta(grupo) {
  return {
    id: grupo.id,
    nome: grupo.nome,
    linkDgp: grupo.linkDgp,
    anoCriacao: grupo.anoCriacao,
    membros: grupo.membros,
    projetos: grupo.projetos,
  };
}

export function listaDeGruposResposta(grupos) {
  return grupos.map(grupoResumoResposta);
}
