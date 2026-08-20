import { listaDePesquisadoresResposta } from '../dto/pesquisadorDTO.js';
import * as pesquisadorConsultaService from '../services/pesquisadorConsultaService.js';

export async function listar(req, res) {
  const resultado = await pesquisadorConsultaService.listar(req.query);

  res.json({
    pesquisadores: listaDePesquisadoresResposta(resultado.pesquisadores),
    paginacao: resultado.paginacao,
  });
}
