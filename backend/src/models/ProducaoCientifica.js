import { randomUUID } from 'node:crypto';

export const TIPOS_TRABALHO = ['ARTIGO', 'TCC', 'DISSERTACAO', 'PROJETO_DE_PESQUISA', 'OUTRO'];

export function novaProducao({
  titulo,
  tipoTrabalho,
  autores,
  resumo,
  palavrasChave,
  anoPublicacao,
  arquivoOuLink,
  criadoPorId,
}) {
  return {
    id: randomUUID(),
    titulo,
    tipoTrabalho,
    autores,
    resumo,
    palavrasChave,
    anoPublicacao,
    arquivoOuLink,
    criadoPorId,
    criadoEm: new Date().toISOString(),
  };
}
