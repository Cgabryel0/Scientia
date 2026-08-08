/**
 * Guarda os usuários em memória. Isolamos o acesso aqui para que trocar por um
 * banco de verdade nas próximas iterações mexa só neste arquivo.
 */
const usuarios = [];

export function salvar(usuario) {
  usuarios.push(usuario);
  return usuario;
}

export function buscarPorEmail(email) {
  return usuarios.find((usuario) => usuario.email === normalizarEmail(email));
}

export function buscarPorId(id) {
  return usuarios.find((usuario) => usuario.id === id);
}

export function listarTodos() {
  return [...usuarios];
}

export function normalizarEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}
