export function montarPadraoBusca(valor) {
  return `%${valor.replace(/[\\%_]/g, String.raw`\$&`)}%`;
}
