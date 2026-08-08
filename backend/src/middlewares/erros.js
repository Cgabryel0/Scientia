import { ErroHttp } from '../erros/ErroHttp.js';

export function rotaNaoEncontrada(req, res, next) {
  next(new ErroHttp(404, `Não existe a rota ${req.method} ${req.path}.`));
}

export function tratadorDeErros(erro, req, res, next) {
  const status = erro.status ?? 500;

  // Erro sem status é falha nossa: registra no console e responde algo genérico,
  // porque a mensagem original pode expor detalhes internos.
  if (status === 500) {
    console.error(erro);
    return res.status(500).json({ mensagem: 'Erro inesperado no servidor.' });
  }

  res.status(status).json({ mensagem: erro.message });
}
