export function cursoResposta(curso) {
  return {
    id: curso.id,
    nome: curso.nome,
  };
}

export function listaDeCursosResposta(cursos) {
  return cursos.map(cursoResposta);
}
