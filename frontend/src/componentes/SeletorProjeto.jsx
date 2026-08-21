import * as projetoService from '../servicos/projetoService.js';
import { ROTULOS_STATUS } from '../utils/acervo.js';
import { SeletorComBusca } from './SeletorComBusca.jsx';

const RESULTADOS_POR_BUSCA = 15;

export function SeletorProjeto({ aoSelecionar }) {
  return (
    <SeletorComBusca
      rotulo="Projeto"
      placeholder="Busque pelo título do projeto"
      porPagina={RESULTADOS_POR_BUSCA}
      buscar={({ busca, porPagina }) =>
        projetoService.listar({ busca, porPagina }).then((dados) => dados.projetos)
      }
      mensagemCarregando="Carregando projetos..."
      mensagemVazio="Nenhum projeto corresponde à busca."
      mensagemErro="Não foi possível carregar os projetos."
      textoTrocar="Trocar projeto"
      renderEscolhido={(projeto) => <strong>{projeto.titulo}</strong>}
      renderResultado={(projeto) => (
        <>
          <strong>{projeto.titulo}</strong>{' '}
          <span className="seletor-busca__detalhe">
            {ROTULOS_STATUS[projeto.status] ?? projeto.status}
            {projeto.grupo ? ` · ${projeto.grupo.nome}` : ''}
          </span>
        </>
      )}
      aoSelecionar={aoSelecionar}
    />
  );
}
