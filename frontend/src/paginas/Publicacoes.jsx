import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Paginacao } from '../componentes/Paginacao.jsx';
import * as publicacaoService from '../servicos/publicacaoService.js';
import { nomesDosAutores, POR_PAGINA, ROTULOS_TIPO } from '../utils/acervo.js';

export function Publicacoes() {
  const [publicacoes, setPublicacoes] = useState([]);
  const [paginacao, setPaginacao] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');
  const [ano, setAno] = useState('');
  const [pagina, setPagina] = useState(1);

  const [buscaAplicada, setBuscaAplicada] = useState('');

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setBuscaAplicada(busca);
      setPagina(1);
    }, 400);

    return () => clearTimeout(temporizador);
  }, [busca]);

  useEffect(() => {
    let atual = true;
    setCarregando(true);
    setErro('');

    publicacaoService
      .listar({ busca: buscaAplicada, tipo, ano, pagina, porPagina: POR_PAGINA })
      .then((dados) => {
        if (!atual) {
          return;
        }
        setPublicacoes(dados.publicacoes);
        setPaginacao(dados.paginacao);
      })
      .catch((falha) => atual && setErro(falha.message))
      .finally(() => atual && setCarregando(false));

    return () => {
      atual = false;
    };
  }, [buscaAplicada, tipo, ano, pagina]);

  const filtrosAtivos = Boolean(buscaAplicada.trim() || tipo || ano);

  function trocarTipo(evento) {
    setTipo(evento.target.value);
    setPagina(1);
  }

  function trocarAno(evento) {
    setAno(evento.target.value);
    setPagina(1);
  }

  function limparFiltros() {
    setBusca('');
    setTipo('');
    setAno('');
    setPagina(1);
  }

  return (
    <section>
      <div className="pagina__cabecalho">
        <div>
          <h1 className="pagina__titulo">Publicações</h1>
          <p className="pagina__descricao">
            Consulte as publicações produzidas pelos projetos de pesquisa do BCC.
          </p>
        </div>
      </div>

      <form className="filtros-acervo" onSubmit={(evento) => evento.preventDefault()}>
        <label className="campo filtros-acervo__busca">
          <span>Buscar</span>
          <input
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Título ou autor"
          />
        </label>

        <label className="campo">
          <span>Tipo</span>
          <select value={tipo} onChange={trocarTipo}>
            <option value="">Todos</option>
            {Object.entries(ROTULOS_TIPO).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          <span>Ano</span>
          <input
            type="number"
            value={ano}
            onChange={trocarAno}
            placeholder="Ex.: 2024"
          />
        </label>

        <button
          type="button"
          className="botao botao--discreto"
          onClick={limparFiltros}
          disabled={!filtrosAtivos}
        >
          Limpar
        </button>
      </form>

      {erro && <p className="alerta alerta--erro">{erro}</p>}
      {carregando && <p className="aviso-carregando">Carregando publicações...</p>}

      {!carregando && !erro && publicacoes.length === 0 && (
        <div className="aviso-central">
          {filtrosAtivos ? (
            <p>Nenhuma publicação corresponde aos filtros escolhidos.</p>
          ) : (
            <p>O acervo ainda não tem publicações.</p>
          )}
        </div>
      )}

      {!carregando && !erro && publicacoes.length > 0 && (
        <ul className="lista-acervo">
          {publicacoes.map((publicacao) => (
            <li key={publicacao.id} className="cartao cartao-acervo">
              <div className="cartao-acervo__topo">
                <span className="etiqueta etiqueta--tipo">
                  {ROTULOS_TIPO[publicacao.tipo] ?? publicacao.tipo}
                </span>
                <span className="cartao-acervo__ano">{publicacao.ano}</span>
              </div>

              <h2 className="cartao-acervo__titulo">{publicacao.titulo}</h2>
              <p className="cartao-acervo__autores">{nomesDosAutores(publicacao.autores)}</p>
              <p className="cartao-acervo__veiculo">{publicacao.veiculo}</p>

              {publicacao.projeto && (
                <p className="cartao-acervo__vinculo">
                  Projeto:{' '}
                  <Link to={`/projetos/${publicacao.projeto.id}`}>
                    {publicacao.projeto.titulo}
                  </Link>
                </p>
              )}

              {publicacao.doi && (
                <a
                  className="cartao-acervo__link"
                  href={`https://doi.org/${publicacao.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  DOI: {publicacao.doi}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      {!carregando && !erro && <Paginacao paginacao={paginacao} aoTrocarPagina={setPagina} />}
    </section>
  );
}
