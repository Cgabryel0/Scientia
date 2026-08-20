import { ErroHttp } from '../erros/ErroHttp.js';

export const POR_PAGINA_PADRAO = 20;
export const POR_PAGINA_MAXIMO = 100;
export const POSTGRES_INTEGER_MINIMO = -2147483648;
export const POSTGRES_INTEGER_MAXIMO = 2147483647;

export function validarPaginacao({ pagina, porPagina }) {
  const paginaNormalizada = parametroAusente(pagina) ? 1 : Number(pagina);
  const porPaginaNormalizado = parametroAusente(porPagina) ? POR_PAGINA_PADRAO : Number(porPagina);

  if (!Number.isInteger(paginaNormalizada) || paginaNormalizada < 1 || paginaNormalizada > POSTGRES_INTEGER_MAXIMO) {
    throw new ErroHttp(400, 'A página deve ser um número inteiro maior que zero.');
  }

  if (
    !Number.isInteger(porPaginaNormalizado) ||
    porPaginaNormalizado < 1 ||
    porPaginaNormalizado > POR_PAGINA_MAXIMO ||
    porPaginaNormalizado > POSTGRES_INTEGER_MAXIMO
  ) {
    throw new ErroHttp(400, 'A quantidade por página deve ser um número inteiro entre 1 e 100.');
  }

  return {
    pagina: paginaNormalizada,
    porPagina: porPaginaNormalizado,
    limite: porPaginaNormalizado,
    deslocamento: (paginaNormalizada - 1) * porPaginaNormalizado,
  };
}

export function validarInteiroOpcional(valor, mensagem, opcoes = {}) {
  if (parametroAusente(valor)) {
    return undefined;
  }

  const numero = Number(valor);
  const minimo = opcoes.minimo ?? POSTGRES_INTEGER_MINIMO;

  if (
    !Number.isInteger(numero) ||
    numero < minimo ||
    numero > POSTGRES_INTEGER_MAXIMO ||
    (opcoes.maximo !== undefined && numero > opcoes.maximo)
  ) {
    throw new ErroHttp(400, mensagem);
  }

  return numero;
}

export function validarId(valor) {
  const id = Number(valor);

  if (!Number.isInteger(id) || id < 1 || id > POSTGRES_INTEGER_MAXIMO) {
    throw new ErroHttp(400, 'O id deve ser um número inteiro maior que zero.');
  }

  return id;
}

export function validarEnumOpcional(valor, permitidos, mensagem) {
  if (parametroAusente(valor)) {
    return undefined;
  }

  if (!permitidos.includes(valor)) {
    throw new ErroHttp(400, mensagem);
  }

  return valor;
}

function parametroAusente(valor) {
  return valor === undefined || (typeof valor === 'string' && valor.trim() === '');
}
