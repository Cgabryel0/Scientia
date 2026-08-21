const ESCAPE_CURINGA = String.raw`\$&`;

export function montarPadraoBusca(valor) {
  return `%${valor.replace(/[\\%_]/g, ESCAPE_CURINGA)}%`;
}
