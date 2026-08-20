import { useEffect, useState } from 'react';

import * as pesquisadorService from '../servicos/pesquisadorService.js';
import { ROTULOS_VINCULO } from '../utils/acervo.js';

const RESULTADOS_POR_BUSCA = 10;

const AUTOR_NOVO_INICIAL = {
  nome: '',
  numeroLattes: '',
  vinculo: 'docente',
  email: '',
};

export function AutoresPesquisadorInput({ aoAlterar }) {
  const [autores, setAutores] = useState([]);
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [encontrados, setEncontrados] = useState([]);
  const [procurando, setProcurando] = useState(false);
  const [aviso, setAviso] = useState('');

  const [abrirNovo, setAbrirNovo] = useState(false);
  const [autorNovo, setAutorNovo] = useState(AUTOR_NOVO_INICIAL);

  useEffect(() => {
    const temporizador = setTimeout(() => setBuscaAplicada(busca), 400);

    return () => clearTimeout(temporizador);
  }, [busca]);

  useEffect(() => {
    if (!buscaAplicada.trim()) {
      setEncontrados([]);
      setProcurando(false);
      return undefined;
    }

    let atual = true;
    setProcurando(true);

    pesquisadorService
      .listar({ busca: buscaAplicada, porPagina: RESULTADOS_POR_BUSCA })
      .then((dados) => atual && setEncontrados(dados.pesquisadores))
      .catch(() => atual && setEncontrados([]))
      .finally(() => atual && setProcurando(false));

    return () => {
      atual = false;
    };
  }, [buscaAplicada]);

  function trocarLista(proximos) {
    setAutores(proximos);
    aoAlterar(proximos.map(paraCorpoDoAutor));
  }

  function adicionarExistente(pesquisador) {
    if (jaEstaNaLista(autores, { id: pesquisador.id, numeroLattes: pesquisador.numeroLattes })) {
      setAviso('Esse autor já está na lista.');
      return;
    }

    setAviso('');
    trocarLista([...autores, { ...pesquisador, novo: false }]);
  }

  function alterarAutorNovo(evento) {
    const { name, value } = evento.target;
    setAutorNovo((anterior) => ({ ...anterior, [name]: value }));
  }

  function adicionarNovo() {
    const nome = autorNovo.nome.trim();
    const numeroLattes = autorNovo.numeroLattes.trim();

    if (!nome || !numeroLattes) {
      setAviso('Informe o nome e o número Lattes do autor novo.');
      return;
    }

    if (jaEstaNaLista(autores, { numeroLattes })) {
      setAviso('Esse autor já está na lista.');
      return;
    }

    setAviso('');
    setAutorNovo(AUTOR_NOVO_INICIAL);
    setAbrirNovo(false);
    trocarLista([
      ...autores,
      {
        nome,
        numeroLattes,
        vinculo: autorNovo.vinculo,
        email: autorNovo.email.trim(),
        novo: true,
      },
    ]);
  }

  function mover(posicao, destino) {
    if (destino < 0 || destino >= autores.length) {
      return;
    }

    const proximos = [...autores];
    [proximos[posicao], proximos[destino]] = [proximos[destino], proximos[posicao]];
    trocarLista(proximos);
  }

  function remover(posicao) {
    setAviso('');
    trocarLista(autores.filter((_, indice) => indice !== posicao));
  }

  return (
    <div className="editor-autores">
      <div className="editor-autores__cabecalho">
        <h2>Autores</h2>
        <p>A ordem da lista é a ordem de autoria enviada ao acervo.</p>
      </div>

      {autores.length === 0 ? (
        <p className="editor-autores__vazio">Nenhum autor escolhido até agora.</p>
      ) : (
        <ol className="editor-autores__lista">
          {autores.map((autor, posicao) => (
            <li key={autor.novo ? autor.numeroLattes : autor.id} className="editor-autores__item">
              <span className="editor-autores__posicao">{posicao + 1}</span>

              <div className="editor-autores__dados">
                <strong>{autor.nome}</strong>
                <span className="seletor-busca__detalhe">
                  {ROTULOS_VINCULO[autor.vinculo] ?? autor.vinculo}
                  {autor.novo ? ` · novo · Lattes ${autor.numeroLattes}` : ' · já cadastrado'}
                </span>
              </div>

              <div className="editor-autores__acoes">
                <button
                  type="button"
                  className="botao botao--discreto"
                  onClick={() => mover(posicao, posicao - 1)}
                  disabled={posicao === 0}
                  aria-label={`Subir ${autor.nome}`}
                >
                  Subir
                </button>
                <button
                  type="button"
                  className="botao botao--discreto"
                  onClick={() => mover(posicao, posicao + 1)}
                  disabled={posicao === autores.length - 1}
                  aria-label={`Descer ${autor.nome}`}
                >
                  Descer
                </button>
                <button
                  type="button"
                  className="botao botao--discreto"
                  onClick={() => remover(posicao)}
                  aria-label={`Remover ${autor.nome}`}
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {aviso && <p className="alerta alerta--erro">{aviso}</p>}

      <label className="campo">
        <span>Buscar pesquisador</span>
        <input
          type="search"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Nome do pesquisador"
        />
      </label>

      {procurando && <p className="seletor-busca__estado">Procurando pesquisadores...</p>}

      {!procurando && buscaAplicada.trim() && encontrados.length === 0 && (
        <p className="seletor-busca__estado">
          Nenhum pesquisador encontrado. Você pode cadastrar o autor abaixo.
        </p>
      )}

      {!procurando && encontrados.length > 0 && (
        <ul className="seletor-busca__resultados">
          {encontrados.map((pesquisador) => (
            <li key={pesquisador.id}>
              <button
                type="button"
                className="seletor-busca__resultado"
                onClick={() => adicionarExistente(pesquisador)}
                disabled={jaEstaNaLista(autores, pesquisador)}
              >
                <strong>{pesquisador.nome}</strong>{' '}
                <span className="seletor-busca__detalhe">
                  {ROTULOS_VINCULO[pesquisador.vinculo] ?? pesquisador.vinculo} ·{' '}
                  {pesquisador.totalPublicacoes}{' '}
                  {pesquisador.totalPublicacoes === 1 ? 'publicação' : 'publicações'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {abrirNovo ? (
        <div className="editor-autores__novo">
          <label className="campo">
            <span>Nome do autor</span>
            <input type="text" name="nome" value={autorNovo.nome} onChange={alterarAutorNovo} />
          </label>

          <label className="campo">
            <span>Número Lattes</span>
            <input
              type="text"
              name="numeroLattes"
              value={autorNovo.numeroLattes}
              onChange={alterarAutorNovo}
            />
          </label>

          <label className="campo">
            <span>Vínculo</span>
            <select name="vinculo" value={autorNovo.vinculo} onChange={alterarAutorNovo}>
              {Object.entries(ROTULOS_VINCULO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>

          <label className="campo">
            <span>E-mail (opcional)</span>
            <input type="email" name="email" value={autorNovo.email} onChange={alterarAutorNovo} />
          </label>

          <div className="editor-autores__acoes">
            <button type="button" className="botao botao--discreto" onClick={adicionarNovo}>
              Adicionar autor novo
            </button>
            <button
              type="button"
              className="botao botao--discreto"
              onClick={() => setAbrirNovo(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="botao botao--discreto"
          onClick={() => setAbrirNovo(true)}
        >
          Cadastrar um autor que ainda não está no acervo
        </button>
      )}
    </div>
  );
}

function paraCorpoDoAutor(autor) {
  if (!autor.novo) {
    return { id: autor.id };
  }

  return {
    nome: autor.nome,
    numeroLattes: autor.numeroLattes,
    vinculo: autor.vinculo,
    email: autor.email,
  };
}

function jaEstaNaLista(autores, candidato) {
  return autores.some(
    (autor) =>
      (candidato.id !== undefined && autor.id === candidato.id) ||
      (Boolean(candidato.numeroLattes) && autor.numeroLattes === candidato.numeroLattes),
  );
}
