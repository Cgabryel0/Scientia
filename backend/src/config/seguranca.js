/**
 * Concentra em um lugar só quais endpoints são abertos. Tudo que não estiver
 * listado aqui passa obrigatoriamente pelo filtro de autenticação, e as travas
 * por papel ficam declaradas nas rotas com o middleware exigeRole.
 */
const ROTAS_PUBLICAS = [
  { metodo: 'GET', caminho: '/api/status' },
  { metodo: 'POST', caminho: '/api/auth/cadastro' },
  { metodo: 'POST', caminho: '/api/auth/login' },
];

export function rotaEhPublica(metodo, caminho) {
  const semBarraFinal = caminho.length > 1 ? caminho.replace(/\/$/, '') : caminho;
  return ROTAS_PUBLICAS.some((rota) => rota.metodo === metodo && rota.caminho === semBarraFinal);
}
