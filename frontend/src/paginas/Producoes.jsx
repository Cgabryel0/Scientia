import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../contexto/AuthContext.jsx';
import * as producaoConsultaService from '../servicos/producaoConsultaService.js';

const ROTULOS_TIPO = {
  ARTIGO: 'Artigo',
  TCC: 'TCC',
  DISSERTACAO: 'Dissertação',
  PROJETO_DE_PESQUISA: 'Projeto de pesquisa',
  OUTRO: 'Outro',
};

export function Producoes() {
  const { token } = useAuth();

  const [producoes, setProducoes] = useState([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [busca, setBusca] = useState('');
  const [tipoTrabalho, setTipoTrabalho] = useState('');
  const [anoPublicacao, setAnoPublicacao] = useState('');

  // A busca digitada só vira requisição depois de uma pequena pausa, para não
  // chamar a API a cada tecla.
  const [buscaAplicada, setBuscaAplicada] = useState('');

  useEffect(() => {
    const temporizador = setTimeout(() => setBuscaAplicada(busca), 400);
    return () => clearTimeout(temporizador);
  }, [busca]);

  useEffect(() => {
    // Se os filtros mudarem antes da resposta chegar, a resposta velha é descartada.
    let atual = true;
    setCarregando(true);
    setErro('');

    producaoConsultaService
      .listar({ busca: buscaAplicada, tipoTrabalho, anoPublicacao }, token)
      .then((dados) => atual && setProducoes(dados.producoes))
      .catch((falha) => atual && setErro(falha.message))
      .finally(() => atual && setCarregando(false));

    return () => {
      atual = false;
    };
  }, [buscaAplicada, tipoTrabalho, anoPublicacao, token]);

  const filtrosAtivos = Boolean(buscaAplicada.trim() || tipoTrabalho || anoPublicacao);

  function limparFiltros() {
    setBusca('');
    setTipoTrabalho('');
    setAnoPublicacao('');
  }

  return (
    <section>
      <div className="pagina__cabecalho">
        <div>
          <h1 className="pagina__titulo">Acervo de produções</h1>
          <p className="pagina__descricao">
            Consulte as produções científicas da comunidade do BCC.
          </p>
        </div>
        <Link to="/producoes/cadastro" className="botao botao--primario botao--compacto">
          Cadastrar produção
        </Link>
      </div>

      <form className="filtros-acervo" onSubmit={(evento) => evento.preventDefault()}>
        <label className="campo filtros-acervo__busca">
          <span>Buscar</span>
          <input
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Título, autor ou palavra-chave"
          />
        </label>

        <label className="campo">
          <span>Tipo</span>
          <select value={tipoTrabalho} onChange={(evento) => setTipoTrabalho(evento.target.value)}>
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
            value={anoPublicacao}
            onChange={(evento) => setAnoPublicacao(evento.target.value)}
            placeholder="Ex.: 2026"
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
      {carregando && <p className="aviso-carregando">Carregando produções...</p>}

      {!carregando && !erro && producoes.length === 0 && (
        <div className="aviso-central">
          {filtrosAtivos ? (
            <p>Nenhuma produção corresponde aos filtros escolhidos.</p>
          ) : (
            <>
              <p>O acervo ainda está vazio.</p>
              <Link to="/producoes/cadastro" className="botao botao--primario">
                Cadastrar a primeira produção
              </Link>
            </>
          )}
        </div>
      )}

      {!carregando && !erro && producoes.length > 0 && (
        <ul className="lista-producoes">
          {producoes.map((producao) => (
            <li key={producao.id} className="cartao cartao-acervo">
              <div className="cartao-acervo__topo">
                <span className="etiqueta etiqueta--tipo">
                  {ROTULOS_TIPO[producao.tipoTrabalho] ?? producao.tipoTrabalho}
                </span>
                <span className="cartao-acervo__ano">{producao.anoPublicacao}</span>
              </div>

              <h2 className="cartao-acervo__titulo">{producao.titulo}</h2>
              <p className="cartao-acervo__autores">{producao.autores.join(', ')}</p>
              <p className="cartao-acervo__resumo">{producao.resumo}</p>

              <ul className="lista-chips">
                {producao.palavrasChave.map((palavra) => (
                  <li key={palavra} className="chip">
                    {palavra}
                  </li>
                ))}
              </ul>

              <a
                className="cartao-acervo__link"
                href={producao.arquivoOuLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Acessar produção
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
