import { listaDePublicacoesResposta, publicacaoResposta } from '../dto/publicacaoDTO.js';
import * as publicacaoService from '../services/publicacaoService.js';

export async function listar(req, res) {
  const resultado = await publicacaoService.listar(req.query);

  res.json({
    publicacoes: listaDePublicacoesResposta(resultado.publicacoes),
    paginacao: resultado.paginacao,
  });
}

export async function detalhar(req, res) {
  const publicacao = await publicacaoService.buscarPorId(req.params.id);
  res.json({ publicacao: publicacaoResposta(publicacao) });
}

export async function cadastrar(req, res) {
  const publicacao = await publicacaoService.cadastrar(req.body ?? {}, req.usuario);
  res.status(201).json({ publicacao: publicacaoResposta(publicacao) });
}
