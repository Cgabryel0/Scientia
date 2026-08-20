import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Paginacao } from '../componentes/Paginacao.jsx';
import * as projetoService from '../servicos/projetoService.js';
import { POR_PAGINA, ROTULOS_STATUS } from '../utils/acervo.js';

export function Projetos() {
  const [projetos, setProjetos] = useState([]);
  const [paginacao, setPaginacao] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('');
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

    projetoService
      .listar({ busca: buscaAplicada, status, pagina, porPagina: POR_PAGINA })
      .then((dados) => {
        if (!atual) {
          return;
        }
        setProjetos(dados.projetos);
        setPaginacao(dados.paginacao);
      })
      .catch((falha) => atual && setErro(falha.message))
      .finally(() => atual && setCarregando(false));

    return () => {
      atual = false;
    };
  }, [buscaAplicada, status, pagina]);

  const filtrosAtivos = Boolean(buscaAplicada.trim() || status);

  function trocarStatus(evento) {
    setStatus(evento.target.value);
    setPagina(1);
  }

  function limparFiltros() {
    setBusca('');
    setStatus('');
    setPagina(1);
  }

  return (
    <section>
      <div className="pagina__cabecalho">
        <div>
          <h1 className="pagina__titulo">Projetos de pesquisa</h1>
          <p className="pagina__descricao">
            Veja os projetos dos grupos de pesquisa e as publicações que saíram deles.
          </p>
        </div>
      </div>

      <form
        className="filtros-acervo filtros-acervo--duplo"
        onSubmit={(evento) => evento.preventDefault()}
      >
        <label className="campo filtros-acervo__busca">
          <span>Buscar</span>
          <input
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Título do projeto"
          />
        </label>

        <label className="campo">
          <span>Situação</span>
          <select value={status} onChange={trocarStatus}>
            <option value="">Todas</option>
            {Object.entries(ROTULOS_STATUS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
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
      {carregando && <p className="aviso-carregando">Carregando projetos...</p>}

      {!carregando && !erro && projetos.length === 0 && (
        <div className="aviso-central">
          {filtrosAtivos ? (
            <p>Nenhum projeto corresponde aos filtros escolhidos.</p>
          ) : (
            <p>Nenhum projeto de pesquisa cadastrado até agora.</p>
          )}
        </div>
      )}

      {!carregando && !erro && projetos.length > 0 && (
        <ul className="lista-acervo">
          {projetos.map((projeto) => (
            <li key={projeto.id} className="cartao cartao-acervo">
              <div className="cartao-acervo__topo">
                <span className={`etiqueta etiqueta--situacao etiqueta--${projeto.status}`}>
                  {ROTULOS_STATUS[projeto.status] ?? projeto.status}
                </span>
                <span className="cartao-acervo__ano">
                  {projeto.totalPublicacoes}{' '}
                  {projeto.totalPublicacoes === 1 ? 'publicação' : 'publicações'}
                </span>
              </div>

              <h2 className="cartao-acervo__titulo">
                <Link to={`/projetos/${projeto.id}`}>{projeto.titulo}</Link>
              </h2>

              {projeto.grupo && (
                <p className="cartao-acervo__vinculo">
                  Grupo: <Link to={`/grupos/${projeto.grupo.id}`}>{projeto.grupo.nome}</Link>
                </p>
              )}

              <ul className="lista-chips">
                {projeto.areas.map((area) => (
                  <li key={area.id} className="chip">
                    {area.nome}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {!carregando && !erro && <Paginacao paginacao={paginacao} aoTrocarPagina={setPagina} />}
    </section>
  );
}
