import { ErroHttp } from '../erros/ErroHttp.js';

export const POR_PAGINA_PADRAO = 20;
export const POR_PAGINA_MAXIMO = 100;

export function validarPaginacao({ pagina, porPagina }) {
  const paginaNormalizada = pagina === undefined ? 1 : Number(pagina);
  const porPaginaNormalizado = porPagina === undefined ? POR_PAGINA_PADRAO : Number(porPagina);

  if (!Number.isInteger(paginaNormalizada) || paginaNormalizada < 1) {
    throw new ErroHttp(400, 'A página deve ser um número inteiro maior que zero.');
  }

  if (!Number.isInteger(porPaginaNormalizado) || porPaginaNormalizado < 1 || porPaginaNormalizado > POR_PAGINA_MAXIMO) {
    throw new ErroHttp(400, 'A quantidade por página deve ser um número inteiro entre 1 e 100.');
  }

  return {
    pagina: paginaNormalizada,
    porPagina: porPaginaNormalizado,
    limite: porPaginaNormalizado,
    deslocamento: (paginaNormalizada - 1) * porPaginaNormalizado,
  };
}

export function validarInteiroOpcional(valor, mensagem) {
  if (valor === undefined || valor === '') {
    return undefined;
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero)) {
    throw new ErroHttp(400, mensagem);
  }

  return numero;
}

export function validarId(valor) {
  const id = Number(valor);

  if (!Number.isInteger(id) || id < 1) {
    throw new ErroHttp(400, 'O id deve ser um número inteiro maior que zero.');
  }

  return id;
}

export function validarEnumOpcional(valor, permitidos, mensagem) {
  if (valor === undefined || valor === '') {
    return undefined;
  }

  if (!permitidos.includes(valor)) {
    throw new ErroHttp(400, mensagem);
  }

  return valor;
}
