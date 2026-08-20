export function usuarioResposta(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    tipo: usuario.tipo,
    criadoEm: usuario.criadoEm,
  };
}

export function usuarioComPerfilResposta(usuario) {
  return {
    ...usuarioResposta(usuario),
    perfil: usuario.perfil,
  };
}

export function listaDeUsuariosResposta(usuarios) {
  return usuarios.map(usuarioResposta);
}
