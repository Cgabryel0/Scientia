import { requisitar } from './api.js';

export function montarQueryDeFiltros(filtros) {
  const params = new URLSearchParams();
  
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor) {
      params.append(chave, valor);
    }
  });
  
  return params.toString();
}

export async function listar(filtros, token) {
  const queryString = montarQueryDeFiltros(filtros);
  const url = queryString ? `/producoes?${queryString}` : '/producoes';
  
  // Repassamos a URL e o objeto com metodo e token para a função customizada do grupo
  return await requisitar(url, { metodo: 'GET', token });
}
