import * as producaoConsultaService from '../services/producaoConsultaService.js';

export const listar = async (req, res, next) => {
  try {
    const filtros = {
      busca: req.query.busca,
      titulo: req.query.titulo,
      autor: req.query.autor,
      tipoTrabalho: req.query.tipoTrabalho,
      palavraChave: req.query.palavraChave,
      anoPublicacao: req.query.anoPublicacao
    };

    const producoes = await producaoConsultaService.listar(filtros);
    // Envolvemos a resposta em um objeto contendo a chave producoes
    res.status(200).json({ producoes });
  } catch (erro) {
    next(erro);
  }
};
