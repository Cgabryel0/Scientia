const URL_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

/**
 * Ponto único de conversa com a API. Quando recebe um token, ele vai no
 * cabeçalho Authorization, que é o que o filtro do backend espera encontrar.
 */
export async function requisitar(caminho, { metodo = 'GET', corpo, token } = {}) {
  let resposta;
  try {
    resposta = await fetch(URL_BASE + caminho, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new Error('Não foi possível falar com o servidor. Verifique se a API está no ar.');
  }

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.mensagem ?? 'Não foi possível completar a operação.');
  }

  return dados;
}

export function montarConsulta(filtros = {}) {
  const parametros = new URLSearchParams();

  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') {
      parametros.append(chave, valor);
    }
  });

  const consulta = parametros.toString();

  return consulta ? `?${consulta}` : '';
}
