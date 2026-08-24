import { candidaturaResposta, listaDeCandidaturasResposta } from '../dto/candidaturaDTO.js';
import * as candidaturaService from '../services/candidaturaService.js';

export async function listar(req, res) {
  const resultado = await candidaturaService.listar(req.query, req.usuario);
  res.json({
    candidaturas: listaDeCandidaturasResposta(resultado.candidaturas),
    paginacao: resultado.paginacao,
  });
}

export async function detalhar(req, res) {
  const candidatura = await candidaturaService.buscarPorId(
    req.params.idAluno,
    req.params.idVaga,
    req.usuario,
  );
  res.json({ candidatura: candidaturaResposta(candidatura) });
}

export async function cadastrar(req, res) {
  const candidatura = await candidaturaService.cadastrar(req.body ?? {}, req.usuario);
  res.status(201).json({ candidatura: candidaturaResposta(candidatura) });
}

export async function atualizar(req, res) {
  const candidatura = await candidaturaService.atualizar(
    req.params.idAluno,
    req.params.idVaga,
    req.body ?? {},
  );
  res.json({ candidatura: candidaturaResposta(candidatura) });
}

export async function excluir(req, res) {
  await candidaturaService.excluir(req.params.idAluno, req.params.idVaga, req.usuario);
  res.status(204).end();
}
