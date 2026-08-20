import { listaDeProjetosResposta, projetoDetalheResposta } from '../dto/projetoDTO.js';
import * as projetoService from '../services/projetoService.js';

export async function listar(req, res) {
  const resultado = await projetoService.listar(req.query);

  res.json({
    projetos: listaDeProjetosResposta(resultado.projetos),
    paginacao: resultado.paginacao,
  });
}

export async function detalhar(req, res) {
  const projeto = await projetoService.buscarPorId(req.params.id);
  res.json({ projeto: projetoDetalheResposta(projeto) });
}
