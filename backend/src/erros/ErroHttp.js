/**
 * Erro que já carrega o status HTTP que deve voltar para o cliente.
 * Assim os services avisam o que deu errado sem precisar conhecer o Express.
 */
export class ErroHttp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}
