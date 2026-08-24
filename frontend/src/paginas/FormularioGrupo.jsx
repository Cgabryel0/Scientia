import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../contexto/AuthContext.jsx';
import * as grupoService from '../servicos/grupoService.js';

const DADOS_INICIAIS = {
  nome: '',
  linkDgp: '',
  anoCriacao: String(new Date().getFullYear()),
};

export function FormularioGrupo() {
  const { id } = useParams();
  const { token } = useAuth();
  const navegar = useNavigate();
  const [dados, setDados] = useState(DADOS_INICIAIS);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const editando = Boolean(id);

  useEffect(() => {
    if (!editando) {
      return undefined;
    }

    let atual = true;

    grupoService
      .buscarPorId(id)
      .then(({ grupo }) => {
        if (!atual) {
          return;
        }

        setDados({
          nome: grupo.nome,
          linkDgp: grupo.linkDgp ?? '',
          anoCriacao: String(grupo.anoCriacao),
        });
      })
      .catch((falha) => atual && setErro(falha.message));

    return () => {
      atual = false;
    };
  }, [editando, id]);

  function alterar(evento) {
    const { name, value } = evento.target;
    setDados((anterior) => ({ ...anterior, [name]: value }));
  }

  async function enviar(evento) {
    evento.preventDefault();

    const corpo = {
      nome: dados.nome.trim(),
      linkDgp: dados.linkDgp.trim() || null,
      anoCriacao: Number(dados.anoCriacao),
    };

    setErro('');
    setEnviando(true);

    try {
      const resposta = editando
        ? await grupoService.atualizar(id, corpo, token)
        : await grupoService.cadastrar(corpo, token);
      navegar(`/grupos/${resposta.grupo.id}`);
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  }

  return (
    <section>
      <h1 className="pagina__titulo">{editando ? 'Editar grupo' : 'Cadastrar grupo'}</h1>
      <p className="pagina__descricao">Informe os dados básicos do grupo de pesquisa.</p>

      <form className="formulario-acervo" onSubmit={enviar}>
        {erro && <p className="alerta alerta--erro">{erro}</p>}

        <label className="campo">
          <span>Nome</span>
          <input name="nome" value={dados.nome} onChange={alterar} maxLength={150} />
        </label>

        <label className="campo">
          <span>Link DGP (opcional)</span>
          <input name="linkDgp" value={dados.linkDgp} onChange={alterar} maxLength={255} />
        </label>

        <label className="campo">
          <span>Ano de criação</span>
          <input
            type="number"
            min="1950"
            max="2100"
            name="anoCriacao"
            value={dados.anoCriacao}
            onChange={alterar}
          />
        </label>

        <div className="formulario-acervo__acoes">
          <Link
            to={editando ? `/grupos/${id}` : '/grupos'}
            className="botao botao--discreto"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="botao botao--primario botao--compacto"
            disabled={enviando}
          >
            {enviando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar grupo'}
          </button>
        </div>
      </form>
    </section>
  );
}
