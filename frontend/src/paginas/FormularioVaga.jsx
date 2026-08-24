import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../contexto/AuthContext.jsx';
import * as projetoService from '../servicos/projetoService.js';
import * as vagaService from '../servicos/vagaService.js';

const DADOS_INICIAIS = {
  idProjeto: '',
  titulo: '',
  requisitos: '',
  status: 'aberta',
  qtdVagas: '1',
  dataAbertura: new Date().toISOString().slice(0, 10),
};

export function FormularioVaga() {
  const { id } = useParams();
  const { token } = useAuth();
  const navegar = useNavigate();
  const [dados, setDados] = useState(DADOS_INICIAIS);
  const [projetos, setProjetos] = useState([]);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const editando = Boolean(id);

  useEffect(() => {
    let atual = true;

    projetoService
      .listar({ porPagina: 100 })
      .then((resposta) => atual && setProjetos(resposta.projetos))
      .catch((falha) => atual && setErro(falha.message));

    if (editando) {
      vagaService
        .buscarPorId(id)
        .then(({ vaga }) => {
          if (!atual) {
            return;
          }

          setDados({
            idProjeto: String(vaga.projeto.id),
            titulo: vaga.titulo,
            requisitos: vaga.requisitos ?? '',
            status: vaga.status,
            qtdVagas: String(vaga.qtdVagas),
            dataAbertura: vaga.dataAbertura,
          });
        })
        .catch((falha) => atual && setErro(falha.message));
    }

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
      idProjeto: Number(dados.idProjeto),
      titulo: dados.titulo.trim(),
      requisitos: dados.requisitos.trim() || null,
      status: dados.status,
      qtdVagas: Number(dados.qtdVagas),
      dataAbertura: dados.dataAbertura,
    };

    setErro('');
    setEnviando(true);

    try {
      if (editando) {
        await vagaService.atualizar(id, corpo, token);
      } else {
        await vagaService.cadastrar(corpo, token);
      }
      navegar('/vagas');
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  }

  return (
    <section>
      <h1 className="pagina__titulo">{editando ? 'Editar vaga' : 'Cadastrar vaga'}</h1>
      <p className="pagina__descricao">Vincule a oportunidade a um projeto existente.</p>

      <form className="formulario-acervo" onSubmit={enviar}>
        {erro && <p className="alerta alerta--erro">{erro}</p>}

        <label className="campo">
          <span>Projeto</span>
          <select name="idProjeto" value={dados.idProjeto} onChange={alterar}>
            <option value="">Selecione um projeto</option>
            {projetos.map((projeto) => (
              <option key={projeto.id} value={projeto.id}>
                {projeto.titulo}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          <span>Título</span>
          <input name="titulo" value={dados.titulo} onChange={alterar} maxLength={150} />
        </label>

        <label className="campo">
          <span>Requisitos</span>
          <textarea name="requisitos" value={dados.requisitos} onChange={alterar} rows={5} />
        </label>

        <div className="formulario-acervo__linha">
          <label className="campo">
            <span>Status</span>
            <select name="status" value={dados.status} onChange={alterar}>
              <option value="aberta">Aberta</option>
              <option value="fechada">Fechada</option>
            </select>
          </label>

          <label className="campo">
            <span>Quantidade</span>
            <input
              type="number"
              min="1"
              name="qtdVagas"
              value={dados.qtdVagas}
              onChange={alterar}
            />
          </label>

          <label className="campo">
            <span>Data de abertura</span>
            <input
              type="date"
              name="dataAbertura"
              value={dados.dataAbertura}
              onChange={alterar}
            />
          </label>
        </div>

        <div className="formulario-acervo__acoes">
          <Link to="/vagas" className="botao botao--discreto">
            Cancelar
          </Link>
          <button
            type="submit"
            className="botao botao--primario botao--compacto"
            disabled={enviando}
          >
            {enviando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar vaga'}
          </button>
        </div>
      </form>
    </section>
  );
}
