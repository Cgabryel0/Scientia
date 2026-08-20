export function areaResposta(area) {
  return {
    id: area.id,
    nome: area.nome,
  };
}

export function listaDeAreasResposta(areas) {
  return areas.map(areaResposta);
}
