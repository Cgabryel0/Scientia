// Mesma lista de TIPOS_TRABALHO do backend (backend/src/models/ProducaoCientifica.js).
// Como frontend e backend são projetos separados, não dá para importar
// diretamente um do outro — por isso a lista é repetida aqui, com um rótulo
// amigável para exibir no <select>.
export const TIPOS_TRABALHO = [
  { valor: 'ARTIGO', rotulo: 'Artigo' },
  { valor: 'TCC', rotulo: 'TCC' },
  { valor: 'DISSERTACAO', rotulo: 'Dissertação' },
  { valor: 'PROJETO_DE_PESQUISA', rotulo: 'Projeto de pesquisa' },
  { valor: 'OUTRO', rotulo: 'Outro' },
];

const ANO_MINIMO = 1970;

/**
 * Espelha as regras do backend (producaoCadastroService.validarDadosDaProducao)
 * para dar feedback imediato sem precisar de uma ida à API. O backend
 * permanece a fonte de verdade: mesmo que esta função deixe passar algo, o
 * service do servidor valida de novo antes de salvar.
 */
export function validarFormulario({ titulo, tipoTrabalho, autores, resumo, palavrasChave, anoPublicacao, arquivoOuLink }) {
  const erros = {};
  const anoAtual = new Date().getFullYear();

  if (!titulo || !titulo.trim()) {
    erros.titulo = 'Informe o título da produção.';
  }

  if (!TIPOS_TRABALHO.some((tipo) => tipo.valor === tipoTrabalho)) {
    erros.tipoTrabalho = 'Selecione um tipo de trabalho válido.';
  }

  if (!autores || autores.length === 0) {
    erros.autores = 'Informe pelo menos um autor.';
  }

  if (!resumo || !resumo.trim()) {
    erros.resumo = 'Informe um resumo.';
  }

  if (!palavrasChave || palavrasChave.length === 0) {
    erros.palavrasChave = 'Informe pelo menos uma palavra-chave.';
  }

  const ano = Number(anoPublicacao);
  if (!anoPublicacao || !Number.isInteger(ano) || ano < ANO_MINIMO || ano > anoAtual) {
    erros.anoPublicacao = `Informe um ano entre ${ANO_MINIMO} e ${anoAtual}.`;
  }

  if (!arquivoOuLink || !arquivoOuLink.trim()) {
    erros.arquivoOuLink = 'Informe o arquivo ou endereço eletrônico.';
  }

  return erros;
}
