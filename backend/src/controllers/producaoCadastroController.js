import { producaoResposta } from '../dto/producaoDTO.js';
import * as producaoCadastroService from '../services/producaoCadastroService.js';

export function cadastrar(req, res) {
  const { titulo, tipoTrabalho, autores, resumo, palavrasChave, anoPublicacao, arquivoOuLink } =
    req.body ?? {};

  const producao = producaoCadastroService.cadastrar({
    titulo,
    tipoTrabalho,
    autores,
    resumo,
    palavrasChave,
    anoPublicacao,
    arquivoOuLink,
    criadoPorId: Number(req.usuario.sub),
  });

  res.status(201).json({ producao: producaoResposta(producao) });
}
