export function projetoResumoResposta(projeto) {
  return {
    id: projeto.id,
    titulo: projeto.titulo,
    status: projeto.status,
    dataInicio: projeto.dataInicio,
    dataFim: projeto.dataFim,
    grupo: projeto.grupo,
    areas: projeto.areas,
    totalPublicacoes: projeto.totalPublicacoes,
  };
}

export function projetoDetalheResposta(projeto) {
  return {
    id: projeto.id,
    titulo: projeto.titulo,
    resumo: projeto.resumo,
    status: projeto.status,
    dataInicio: projeto.dataInicio,
    dataFim: projeto.dataFim,
    origem: projeto.origem,
    grupo: projeto.grupo,
    edital: projeto.edital,
    areas: projeto.areas,
    equipe: projeto.equipe,
    publicacoes: projeto.publicacoes,
  };
}

export function listaDeProjetosResposta(projetos) {
  return projetos.map(projetoResumoResposta);
}
