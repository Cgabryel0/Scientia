import { useEffect, useState } from 'react';

import * as relatorioService from '../servicos/relatorioService.js';
import { formatarData, ROTULOS_STATUS, ROTULOS_TIPO } from '../utils/acervo.js';

export function Relatorios() {
  const [dados, setDados] = useState({ projetos: [], publicacoes: [], grupos: [] });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let atual = true;

    Promise.all([
      relatorioService.listarProjetos(),
      relatorioService.listarPublicacoes(),
      relatorioService.listarGrupos(),
    ])
      .then(([projetos, publicacoes, grupos]) => {
        if (!atual) {
          return;
        }

        setDados({
          projetos: projetos.projetos,
          publicacoes: publicacoes.publicacoes,
          grupos: grupos.grupos,
        });
      })
      .catch((falha) => atual && setErro(falha.message))
      .finally(() => atual && setCarregando(false));

    return () => {
      atual = false;
    };
  }, []);

  if (carregando) {
    return <p className="aviso-carregando">Carregando relatórios...</p>;
  }

  return (
    <section>
      <h1 className="pagina__titulo">Relatórios</h1>
      <p className="pagina__descricao">
        Dados consolidados diretamente das três Views SQL da entrega.
      </p>
      {erro && <p className="alerta alerta--erro">{erro}</p>}

      <h2 className="detalhe__secao">Projetos detalhados</h2>
      <div className="tabela-responsiva">
        <table className="tabela-relatorio">
          <thead>
            <tr>
              <th>Projeto</th>
              <th>Status</th>
              <th>Grupo</th>
              <th>Edital</th>
              <th>Início</th>
              <th>Publicações</th>
            </tr>
          </thead>
          <tbody>
            {dados.projetos.map((projeto) => (
              <tr key={projeto.idProjeto}>
                <td>{projeto.titulo}</td>
                <td>{ROTULOS_STATUS[projeto.status] ?? projeto.status}</td>
                <td>{projeto.nomeGrupo}</td>
                <td>
                  {projeto.nomeEdital
                    ? `${projeto.nomeEdital} (${projeto.anoEdital})`
                    : 'Sem edital'}
                </td>
                <td>{formatarData(projeto.dataInicio)}</td>
                <td>{projeto.quantidadePublicacoes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="detalhe__secao">Produção bibliográfica</h2>
      <div className="tabela-responsiva">
        <table className="tabela-relatorio">
          <thead>
            <tr>
              <th>Publicação</th>
              <th>Tipo</th>
              <th>Ano</th>
              <th>Projeto</th>
              <th>Grupo</th>
              <th>Autor</th>
              <th>Ordem</th>
            </tr>
          </thead>
          <tbody>
            {dados.publicacoes.map((publicacao, indice) => (
              <tr
                key={`${publicacao.idPublicacao}-${publicacao.idPesquisador ?? 'sem'}-${indice}`}
              >
                <td>{publicacao.tituloPublicacao}</td>
                <td>{ROTULOS_TIPO[publicacao.tipo] ?? publicacao.tipo}</td>
                <td>{publicacao.ano}</td>
                <td>{publicacao.tituloProjeto}</td>
                <td>{publicacao.nomeGrupo}</td>
                <td>{publicacao.nomeAutor ?? 'Sem autoria'}</td>
                <td>{publicacao.ordemAutor ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="detalhe__secao">Grupos de pesquisa</h2>
      <div className="tabela-responsiva">
        <table className="tabela-relatorio">
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Liderança</th>
              <th>Pesquisadores</th>
              <th>Projetos</th>
              <th>Em andamento</th>
            </tr>
          </thead>
          <tbody>
            {dados.grupos.map((grupo) => (
              <tr key={grupo.idGrupo}>
                <td>{grupo.nomeGrupo}</td>
                <td>{grupo.lideres}</td>
                <td>{grupo.quantidadePesquisadores}</td>
                <td>{grupo.quantidadeProjetos}</td>
                <td>{grupo.projetosEmAndamento}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
