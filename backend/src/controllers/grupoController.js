import { grupoDetalheResposta, listaDeGruposResposta } from '../dto/grupoDTO.js';
import * as grupoService from '../services/grupoService.js';

export async function listar(req, res) {
  const resultado = await grupoService.listar(req.query);

  res.json({
    grupos: listaDeGruposResposta(resultado.grupos),
    paginacao: resultado.paginacao,
  });
}

export async function detalhar(req, res) {
  const grupo = await grupoService.buscarPorId(req.params.id);
  res.json({ grupo: grupoDetalheResposta(grupo) });
}
