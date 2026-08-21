import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AutoresPesquisadorInput } from '../componentes/AutoresPesquisadorInput.jsx';
import { SeletorProjeto } from '../componentes/SeletorProjeto.jsx';
import { useAuth } from '../contexto/AuthContext.jsx';
import * as publicacaoService from '../servicos/publicacaoService.js';
import { ROTULOS_TIPO } from '../utils/acervo.js';
import { validarPublicacao } from '../utils/validacaoPublicacao.js';

const DADOS_INICIAIS = {
  titulo: '',
  tipo: 'artigo',
  ano: String(new Date().getFullYear()),
  veiculo: '',
  doi: '',
};

export function CadastroPublicacao() {
  const { token } = useAuth();
  const navegar = useNavigate();

  const [dados, setDados] = useState(DADOS_INICIAIS);
  const [idProjeto, setIdProjeto] = useState(null);
  const [autores, setAutores] = useState([]);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  function alterar(evento) {
    const { name, value } = evento.target;
    setDados((anterior) => ({ ...anterior, [name]: value }));
  }

  async function enviar(evento) {
    evento.preventDefault();

    const corpo = {
      titulo: dados.titulo.trim(),
      tipo: dados.tipo,
      ano: Number(dados.ano),
      doi: dados.doi.trim(),
      veiculo: dados.veiculo.trim(),
      idProjeto,
      autores,
    };

    const problemas = validarPublicacao(corpo);

    if (problemas.length > 0) {
      setErro(problemas.join(' '));
      return;
    }

    setErro('');
    setEnviando(true);

    try {
      await publicacaoService.cadastrar(corpo, token);
      navegar('/publicacoes');
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  }

  return (
    <section>
      <div className="pagina__cabecalho">
        <div>
          <h1 className="pagina__titulo">Cadastrar publicação</h1>
          <p className="pagina__descricao">
            Toda publicação do acervo nasce de um projeto de pesquisa e de uma lista ordenada
            de autores.
          </p>
        </div>
      </div>

      <form className="formulario-acervo" onSubmit={enviar}>
        {erro && <p className="alerta alerta--erro">{erro}</p>}

        <label className="campo">
          <span>Título</span>
          <input
            type="text"
            name="titulo"
            value={dados.titulo}
            onChange={alterar}
            placeholder="Título da publicação"
            maxLength={255}
          />
        </label>

        <div className="formulario-acervo__linha">
          <label className="campo">
            <span>Tipo</span>
            <select name="tipo" value={dados.tipo} onChange={alterar}>
              {Object.entries(ROTULOS_TIPO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>

          <label className="campo">
            <span>Ano</span>
            <input type="number" name="ano" value={dados.ano} onChange={alterar} />
          </label>
        </div>

        <label className="campo">
          <span>Veículo</span>
          <input
            type="text"
            name="veiculo"
            value={dados.veiculo}
            onChange={alterar}
            placeholder="Revista, evento ou livro em que saiu"
            maxLength={150}
          />
        </label>

        <label className="campo">
          <span>DOI (opcional)</span>
          <input
            type="text"
            name="doi"
            value={dados.doi}
            onChange={alterar}
            placeholder="10.1000/exemplo.1"
            maxLength={100}
          />
        </label>

        <SeletorProjeto aoSelecionar={setIdProjeto} />

        <AutoresPesquisadorInput aoAlterar={setAutores} />

        <div className="formulario-acervo__acoes">
          <Link to="/publicacoes" className="botao botao--discreto">
            Cancelar
          </Link>
          <button
            type="submit"
            className="botao botao--primario botao--compacto"
            disabled={enviando}
          >
            {enviando ? 'Cadastrando...' : 'Cadastrar publicação'}
          </button>
        </div>
      </form>
    </section>
  );
}
