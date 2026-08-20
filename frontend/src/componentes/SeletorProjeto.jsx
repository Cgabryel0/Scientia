import { useEffect, useState } from 'react';

import * as projetoService from '../servicos/projetoService.js';
import { ROTULOS_STATUS } from '../utils/acervo.js';

const RESULTADOS_POR_BUSCA = 15;

export function SeletorProjeto({ aoSelecionar }) {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [encontrados, setEncontrados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [escolhido, setEscolhido] = useState(null);

  useEffect(() => {
    const temporizador = setTimeout(() => setBuscaAplicada(busca), 400);

    return () => clearTimeout(temporizador);
  }, [busca]);

  useEffect(() => {
    let atual = true;
    setCarregando(true);

    projetoService
      .listar({ busca: buscaAplicada, porPagina: RESULTADOS_POR_BUSCA })
      .then((dados) => atual && setEncontrados(dados.projetos))
      .catch(() => atual && setEncontrados([]))
      .finally(() => atual && setCarregando(false));

    return () => {
      atual = false;
    };
  }, [buscaAplicada]);

  function escolher(projeto) {
    setEscolhido(projeto);
    aoSelecionar(projeto.id);
  }

  function trocar() {
    setEscolhido(null);
    aoSelecionar(null);
  }

  if (escolhido) {
    return (
      <div className="seletor-busca">
        <span className="campo__rotulo">Projeto</span>
        <p className="seletor-busca__escolhido">
          <strong>{escolhido.titulo}</strong>
          <button type="button" className="botao botao--discreto" onClick={trocar}>
            Trocar projeto
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="seletor-busca">
      <label className="campo">
        <span>Projeto</span>
        <input
          type="search"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Busque pelo título do projeto"
        />
      </label>

      {carregando && <p className="seletor-busca__estado">Carregando projetos...</p>}

      {!carregando && encontrados.length === 0 && (
        <p className="seletor-busca__estado">Nenhum projeto corresponde à busca.</p>
      )}

      {!carregando && encontrados.length > 0 && (
        <ul className="seletor-busca__resultados">
          {encontrados.map((projeto) => (
            <li key={projeto.id}>
              <button
                type="button"
                className="seletor-busca__resultado"
                onClick={() => escolher(projeto)}
              >
                <strong>{projeto.titulo}</strong>{' '}
                <span className="seletor-busca__detalhe">
                  {ROTULOS_STATUS[projeto.status] ?? projeto.status}
                  {projeto.grupo ? ` · ${projeto.grupo.nome}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
