/**
 * Recorta o usuário para o formato que sai da API. Passar sempre por aqui evita
 * o risco de o hash da senha escapar junto em alguma resposta.
 */
export function usuarioResposta(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
    criadoEm: usuario.criadoEm,
  };
}

export function listaDeUsuariosResposta(usuarios) {
  return usuarios.map(usuarioResposta);
}
