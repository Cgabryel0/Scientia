import { requisitar } from './api.js';

/** Monta a query string só com os filtros preenchidos; sem filtro vem tudo. */
export function listar(filtros = {}, token) {
  const parametros = new URLSearchParams();

  for (const [chave, valor] of Object.entries(filtros)) {
    if (String(valor ?? '').trim()) {
      parametros.set(chave, String(valor).trim());
    }
  }

  const consulta = parametros.toString();
  return requisitar(`/producoes${consulta ? `?${consulta}` : ''}`, { token });
}
