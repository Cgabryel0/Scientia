import { totalDePaginas } from '../utils/acervo.js';

export function Paginacao({ paginacao, aoTrocarPagina }) {
  if (!paginacao) {
    return null;
  }

  const paginas = totalDePaginas(paginacao);

  if (paginas <= 1) {
    return null;
  }

  return (
    <nav className="paginacao" aria-label="Paginação">
      <button
        type="button"
        className="botao botao--discreto"
        onClick={() => aoTrocarPagina(paginacao.pagina - 1)}
        disabled={paginacao.pagina <= 1}
      >
        Anterior
      </button>

      <span className="paginacao__posicao">
        Página {paginacao.pagina} de {paginas} · {paginacao.total} resultados
      </span>

      <button
        type="button"
        className="botao botao--discreto"
        onClick={() => aoTrocarPagina(paginacao.pagina + 1)}
        disabled={paginacao.pagina >= paginas}
      >
        Próxima
      </button>
    </nav>
  );
}
