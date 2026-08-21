import * as grupoService from '../servicos/grupoService.js';
import { SeletorComBusca } from './SeletorComBusca.jsx';

const RESULTADOS_POR_BUSCA = 15;

export function SeletorGrupo({ aoSelecionar }) {
  return (
    <SeletorComBusca
      rotulo="Grupo de pesquisa"
      placeholder="Busque pelo nome do grupo"
      porPagina={RESULTADOS_POR_BUSCA}
      buscar={({ busca, porPagina }) =>
        grupoService.listar({ busca, porPagina }).then((dados) => dados.grupos)
      }
      mensagemCarregando="Carregando grupos..."
      mensagemVazio="Nenhum grupo corresponde à busca."
      mensagemErro="Não foi possível carregar os grupos de pesquisa."
      textoTrocar="Trocar grupo"
      renderEscolhido={(grupo) => <strong>{grupo.nome}</strong>}
      renderResultado={(grupo) => (
        <>
          <strong>{grupo.nome}</strong>{' '}
          <span className="seletor-busca__detalhe">
            {grupo.totalProjetos} {grupo.totalProjetos === 1 ? 'projeto' : 'projetos'} ·{' '}
            {grupo.totalMembros} {grupo.totalMembros === 1 ? 'membro' : 'membros'}
          </span>
        </>
      )}
      aoSelecionar={aoSelecionar}
    />
  );
}
