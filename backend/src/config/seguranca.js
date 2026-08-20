const ROTAS_PUBLICAS = [
  { metodo: 'GET', caminho: '/api/status' },
  { metodo: 'GET', caminho: '/api/cursos' },
  { metodo: 'POST', caminho: '/api/auth/cadastro' },
  { metodo: 'POST', caminho: '/api/auth/login' },
];

export function rotaEhPublica(metodo, caminho) {
  const semBarraFinal = caminho.length > 1 ? caminho.replace(/\/$/, '') : caminho;
  return ROTAS_PUBLICAS.some((rota) => rota.metodo === metodo && rota.caminho === semBarraFinal);
}
