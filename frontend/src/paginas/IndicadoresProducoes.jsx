import { useEffect, useState } from 'react';

import { useAuth } from '../contexto/AuthContext.jsx';
import * as relatorioService from '../servicos/relatorioService.js';
import { ROTULOS_TIPO } from '../utils/acervo.js';

export function IndicadoresProducoes() {
  const { token } = useAuth();
  const [indicadores, setIndicadores] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let atual = true;

    relatorioService
      .obterIndicadoresProducoes(token)
      .then((dados) => atual && setIndicadores(dados.indicadores))
      .catch((falha) => atual && setErro(falha.message))
      .finally(() => atual && setCarregando(false));

    return () => {
      atual = false;
    };
  }, [token]);

  if (carregando) {
    return <p className="aviso-carregando">Carregando indicadores...</p>;
  }

  return (
    <section className="indicadores">
      <h1 className="pagina__titulo">Indicadores de produções científicas</h1>
      <p className="pagina__descricao">
        Visão consolidada das produções cadastradas no Scientia por período, tipo e área de
        pesquisa.
      </p>

      {erro && <p className="alerta alerta--erro">{erro}</p>}

      {indicadores && <ConteudoIndicadores indicadores={indicadores} />}
    </section>
  );
}

function ConteudoIndicadores({ indicadores }) {
  const periodo = formatarPeriodo(indicadores.porAno);
  const nomesAreasDestaque = indicadores.areasDestaque.map((area) => area.nome).join(', ');
  const quantidadeDestaque = indicadores.areasDestaque[0]?.quantidade ?? 0;

  return (
    <>
      <div className="indicadores__resumo">
        <article className="indicador-cartao">
          <span>Total de produções</span>
          <strong>{indicadores.totalProducoes}</strong>
          <small>registros científicos cadastrados</small>
        </article>

        <article className="indicador-cartao">
          <span>Período da produção</span>
          <strong>{periodo}</strong>
          <small>com base nos anos cadastrados</small>
        </article>

        <article className="indicador-cartao indicador-cartao--area">
          <span>Área(s) com mais produções</span>
          <strong>{nomesAreasDestaque || '—'}</strong>
          <small>
            {quantidadeDestaque > 0
              ? `${quantidadeDestaque} ${quantidadeDestaque === 1 ? 'produção' : 'produções'}`
              : 'sem produções associadas'}
          </small>
        </article>
      </div>

      {indicadores.totalProducoes === 0 ? (
        <p className="indicadores__vazio">
          Ainda não há produções cadastradas para compor os indicadores.
        </p>
      ) : (
        <>
          <SecaoPorAno itens={indicadores.porAno} />
          <SecaoPorTipo itens={indicadores.porTipo} />
          <SecaoPorArea itens={indicadores.porArea} />
        </>
      )}
    </>
  );
}

function SecaoPorAno({ itens }) {
  const maiorQuantidade = Math.max(...itens.map((item) => item.quantidade), 0);

  return (
    <section className="indicadores__secao">
      <h2>Evolução por ano</h2>
      <p>Quantidade de produções cadastradas em cada ano, em ordem cronológica.</p>

      <div className="tabela-responsiva">
        <table className="tabela-relatorio" aria-label="Produções por ano">
          <thead>
            <tr>
              <th>Ano</th>
              <th>Quantidade</th>
              <th>Comparativo</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.ano}>
                <td>{item.ano}</td>
                <td>{item.quantidade}</td>
                <td className="indicador-barra__celula">
                  <div className="indicador-barra" aria-hidden="true">
                    <span
                      className="indicador-barra__preenchimento"
                      style={{ width: `${calcularPercentual(item.quantidade, maiorQuantidade)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SecaoPorTipo({ itens }) {
  return (
    <section className="indicadores__secao">
      <h2>Produções por tipo</h2>
      <div className="tabela-responsiva">
        <table className="tabela-relatorio" aria-label="Produções por tipo">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.tipo}>
                <td>{ROTULOS_TIPO[item.tipo] ?? item.tipo}</td>
                <td>{item.quantidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SecaoPorArea({ itens }) {
  return (
    <section className="indicadores__secao">
      <h2>Produções por área de pesquisa</h2>
      <div className="tabela-responsiva">
        <table className="tabela-relatorio" aria-label="Produções por área de pesquisa">
          <thead>
            <tr>
              <th>Posição</th>
              <th>Área</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, indice) => (
              <tr key={item.idArea}>
                <td>{indice + 1}</td>
                <td>{item.nome}</td>
                <td>{item.quantidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatarPeriodo(porAno) {
  if (!porAno.length) {
    return '—';
  }

  const primeiroAno = porAno[0].ano;
  const ultimoAno = porAno[porAno.length - 1].ano;

  return primeiroAno === ultimoAno ? String(primeiroAno) : `${primeiroAno}–${ultimoAno}`;
}

function calcularPercentual(quantidade, maiorQuantidade) {
  return maiorQuantidade > 0 ? Math.round((quantidade / maiorQuantidade) * 100) : 0;
}
