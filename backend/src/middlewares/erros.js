import { ErroHttp } from '../erros/ErroHttp.js';

export function rotaNaoEncontrada(req, res, next) {
  next(new ErroHttp(404, `Não existe a rota ${req.method} ${req.path}.`));
}

export function tratadorDeErros(erro, req, res, next) {
  const status = erro.status ?? erro.statusCode ?? 500;

  if (erro.type === 'entity.parse.failed' && erro instanceof SyntaxError && status === 400) {
    return res.status(400).json({ mensagem: 'Corpo da requisição não é um JSON válido.' });
  }

  if (erro.type === 'entity.too.large' && status === 413) {
    return res.status(413).json({ mensagem: 'Corpo da requisição excede o tamanho máximo permitido.' });
  }

  // Erro sem status é falha nossa: registra no console e responde algo genérico,
  // porque a mensagem original pode expor detalhes internos.
  if (status === 500) {
    console.error(erro);
    return res.status(500).json({ mensagem: 'Erro inesperado no servidor.' });
  }

  res.status(status).json({ mensagem: erro.message });
}
