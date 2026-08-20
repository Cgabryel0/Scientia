const ROTAS_PUBLICAS = [
  { metodo: 'GET', caminho: '/api/status' },
  { metodo: 'GET', caminho: '/api/areas' },
  { metodo: 'GET', caminho: '/api/cursos' },
  { metodo: 'GET', caminho: '/api/grupos' },
  { metodo: 'GET', caminho: '/api/grupos/:id' },
  { metodo: 'GET', caminho: '/api/pesquisadores' },
  { metodo: 'GET', caminho: '/api/projetos' },
  { metodo: 'GET', caminho: '/api/projetos/:id' },
  { metodo: 'GET', caminho: '/api/publicacoes' },
  { metodo: 'GET', caminho: '/api/publicacoes/:id' },
  { metodo: 'POST', caminho: '/api/auth/cadastro' },
  { metodo: 'POST', caminho: '/api/auth/login' },
];

export function rotaEhPublica(metodo, caminho) {
  const semBarraFinal = caminho.length > 1 ? caminho.replace(/\/$/, '') : caminho;
  return ROTAS_PUBLICAS.some((rota) => rota.metodo === metodo && caminhoCombina(rota.caminho, semBarraFinal));
}

function caminhoCombina(caminhoPublico, caminhoRecebido) {
  const partesPublicas = caminhoPublico.split('/');
  const partesRecebidas = caminhoRecebido.split('/');

  if (partesPublicas.length !== partesRecebidas.length) {
    return false;
  }

  return partesPublicas.every((parte, indice) => parte.startsWith(':') || parte === partesRecebidas[indice]);
}
