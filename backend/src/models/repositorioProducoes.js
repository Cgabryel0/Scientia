/**
 * Guarda as produções científicas em memória. Isolamos o acesso aqui para que
 * trocar por um banco de verdade nas próximas iterações mexa só neste arquivo.
 */
const producoes = [];

export function salvar(producao) {
  producoes.push(producao);
  return producao;
}

export function buscarPorId(id) {
  return producoes.find((producao) => producao.id === id);
}

export function listarTodos() {
  return [...producoes];
}
