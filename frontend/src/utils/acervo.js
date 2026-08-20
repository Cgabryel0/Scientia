export const ROTULOS_TIPO = {
  artigo: 'Artigo',
  capitulo: 'Capítulo',
  resumo: 'Resumo',
};

export const ROTULOS_STATUS = {
  planejado: 'Planejado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const ROTULOS_PAPEL = {
  coordenador: 'Coordenador',
  participante: 'Participante',
  lider: 'Líder',
  membro: 'Membro',
};

export const POR_PAGINA = 20;

export function ordenarAutores(autores = []) {
  return [...autores].sort((um, outro) => um.ordem - outro.ordem);
}

export function nomesDosAutores(autores) {
  return ordenarAutores(autores)
    .map((autor) => autor.nome)
    .join(', ');
}

export function formatarData(data) {
  if (!data) {
    return '';
  }

  const [ano, mes, dia] = data.slice(0, 10).split('-');

  return `${dia}/${mes}/${ano}`;
}

export function formatarPeriodo(dataInicio, dataFim) {
  const inicio = formatarData(dataInicio);

  return dataFim ? `${inicio} a ${formatarData(dataFim)}` : `${inicio} — em andamento`;
}

export function totalDePaginas(paginacao) {
  if (!paginacao || !paginacao.porPagina) {
    return 1;
  }

  return Math.max(1, Math.ceil(paginacao.total / paginacao.porPagina));
}
