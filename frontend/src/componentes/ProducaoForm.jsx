import { TIPOS_TRABALHO } from '../utils/validacaoProducao.js';

export function ProducaoForm({ dados, onChange, erros }) {
  return (
    <>
      <label className="campo">
        <span>Título</span>
        <input
          type="text"
          name="titulo"
          value={dados.titulo}
          onChange={onChange}
          placeholder="Título da produção científica"
        />
        {erros.titulo && <p className="campo__erro">{erros.titulo}</p>}
      </label>

      <label className="campo">
        <span>Tipo de trabalho</span>
        <select name="tipoTrabalho" value={dados.tipoTrabalho} onChange={onChange}>
          {TIPOS_TRABALHO.map((tipo) => (
            <option key={tipo.valor} value={tipo.valor}>
              {tipo.rotulo}
            </option>
          ))}
        </select>
        {erros.tipoTrabalho && <p className="campo__erro">{erros.tipoTrabalho}</p>}
      </label>

      <label className="campo">
        <span>Resumo</span>
        <textarea
          name="resumo"
          value={dados.resumo}
          onChange={onChange}
          rows={4}
          placeholder="Resumo da produção"
        />
        {erros.resumo && <p className="campo__erro">{erros.resumo}</p>}
      </label>

      <label className="campo">
        <span>Ano de publicação</span>
        <input
          type="number"
          name="anoPublicacao"
          value={dados.anoPublicacao}
          onChange={onChange}
          placeholder={String(new Date().getFullYear())}
        />
        {erros.anoPublicacao && <p className="campo__erro">{erros.anoPublicacao}</p>}
      </label>

      <label className="campo">
        <span>Arquivo ou link</span>
        <input
          type="text"
          name="arquivoOuLink"
          value={dados.arquivoOuLink}
          onChange={onChange}
          placeholder="https://... ou caminho do arquivo"
        />
        {erros.arquivoOuLink && <p className="campo__erro">{erros.arquivoOuLink}</p>}
      </label>
    </>
  );
}
