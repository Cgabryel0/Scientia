import { listaDeProducoesResposta } from '../dto/producaoDTO.js';
import * as producaoConsultaService from '../services/producaoConsultaService.js';

export function listar(req, res) {
  const { busca, tipoTrabalho, anoPublicacao } = req.query;

  const producoes = producaoConsultaService.listar({ busca, tipoTrabalho, anoPublicacao });

  res.json({ producoes: listaDeProducoesResposta(producoes) });
}
