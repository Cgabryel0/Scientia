import { ROTULOS_STATUS } from './acervo.js';

const STATUS_PROJETO = Object.keys(ROTULOS_STATUS);
const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

export function validarProjeto(projeto) {
  const problemas = [];
  const titulo = texto(projeto.titulo);
  const dataInicio = texto(projeto.dataInicio);
  const dataFim = texto(projeto.dataFim);

  if (!titulo) {
    problemas.push('Informe o título.');
  } else if (titulo.length > 255) {
    problemas.push('O título deve ter no máximo 255 caracteres.');
  }

  if (!STATUS_PROJETO.includes(projeto.status)) {
    problemas.push('O status deve ser planejado, em_andamento, concluido ou cancelado.');
  }

  if (!dataValida(dataInicio)) {
    problemas.push('Informe a data de início no formato YYYY-MM-DD.');
  }

  if (dataFim && !dataValida(dataFim)) {
    problemas.push('Informe a data de fim no formato YYYY-MM-DD.');
  }

  if (dataValida(dataInicio) && dataValida(dataFim) && dataFim < dataInicio) {
    problemas.push('A data de fim não pode ser anterior à de início.');
  }

  if (!Number.isInteger(projeto.idGrupo) || projeto.idGrupo < 1) {
    problemas.push('Informe um grupo válido.');
  }

  if (
    !Array.isArray(projeto.areas) ||
    projeto.areas.some((idArea) => !Number.isInteger(idArea) || idArea < 1)
  ) {
    problemas.push('Informe áreas válidas.');
  }

  return problemas;
}

function dataValida(valor) {
  if (!FORMATO_DATA.test(valor)) {
    return false;
  }

  const data = new Date(`${valor}T00:00:00.000Z`);

  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

function texto(valor) {
  return String(valor ?? '').trim();
}
