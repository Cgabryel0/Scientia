import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexto/AuthContext.jsx';
import * as areaService from '../servicos/areaService.js';
import * as grupoService from '../servicos/grupoService.js';
import * as projetoService from '../servicos/projetoService.js';
import { ROTULOS_STATUS } from '../utils/acervo.js';
import { validarProjeto } from '../utils/validacaoProjeto.js';

const DADOS_INICIAIS = {
  titulo: '',
  resumo: '',
  dataInicio: '',
  dataFim: '',
  status: 'em_andamento',
  idGrupo: '',
};

export function CadastroProjeto() {
  const { token } = useAuth();
  const navegar = useNavigate();

  const [dados, setDados] = useState(DADOS_INICIAIS);
  const [grupos, setGrupos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areasEscolhidas, setAreasEscolhidas] = useState([]);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let atual = true;

    grupoService
      .listar({ porPagina: 100 })
      .then((resposta) => atual && setGrupos(resposta.grupos))
      .catch(() => {});

    areaService
      .listar()
      .then((resposta) => atual && setAreas(resposta.areas))
      .catch(() => {});

    return () => {
      atual = false;
    };
  }, []);

  function alterar(evento) {
    const { name, value } = evento.target;
    setDados((anterior) => ({ ...anterior, [name]: value }));
  }

  function alternarArea(idArea) {
    setAreasEscolhidas((anteriores) =>
      anteriores.includes(idArea)
        ? anteriores.filter((escolhida) => escolhida !== idArea)
        : [...anteriores, idArea],
    );
  }

  async function enviar(evento) {
    evento.preventDefault();

    const corpo = {
      titulo: dados.titulo.trim(),
      resumo: dados.resumo.trim(),
      dataInicio: dados.dataInicio,
      dataFim: dados.dataFim || null,
      status: dados.status,
      idGrupo: dados.idGrupo ? Number(dados.idGrupo) : null,
      areas: areasEscolhidas,
    };

    const problemas = validarProjeto(corpo);

    if (problemas.length > 0) {
      setErro(problemas.join(' '));
      return;
    }

    setErro('');
    setEnviando(true);

    try {
      const resposta = await projetoService.cadastrar(corpo, token);
      navegar(`/projetos/${resposta.projeto.id}`);
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  }

  return (
    <section>
      <div className="pagina__cabecalho">
        <div>
          <h1 className="pagina__titulo">Cadastrar projeto</h1>
          <p className="pagina__descricao">
            O projeto entra vinculado a um grupo de pesquisa e você fica registrado como
            coordenador dele.
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
            placeholder="Título do projeto"
            maxLength={255}
          />
        </label>

        <label className="campo">
          <span>Resumo</span>
          <textarea
            name="resumo"
            value={dados.resumo}
            onChange={alterar}
            rows={5}
            placeholder="O que o projeto investiga"
          />
        </label>

        <div className="formulario-acervo__linha">
          <label className="campo">
            <span>Data de início</span>
            <input type="date" name="dataInicio" value={dados.dataInicio} onChange={alterar} />
          </label>

          <label className="campo">
            <span>Data de fim (opcional)</span>
            <input type="date" name="dataFim" value={dados.dataFim} onChange={alterar} />
          </label>
        </div>

        <div className="formulario-acervo__linha">
          <label className="campo">
            <span>Situação</span>
            <select name="status" value={dados.status} onChange={alterar}>
              {Object.entries(ROTULOS_STATUS).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>

          <label className="campo">
            <span>Grupo de pesquisa</span>
            <select name="idGrupo" value={dados.idGrupo} onChange={alterar}>
              <option value="">Selecione um grupo</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="selecao-areas">
          <legend>Áreas do conhecimento (opcional)</legend>
          <ul className="lista-chips">
            {areas.map((area) => (
              <li key={area.id}>
                <label
                  className={`chip chip--escolha${
                    areasEscolhidas.includes(area.id) ? ' chip--marcado' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={areasEscolhidas.includes(area.id)}
                    onChange={() => alternarArea(area.id)}
                  />
                  {area.nome}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <div className="formulario-acervo__acoes">
          <Link to="/projetos" className="botao botao--discreto">
            Cancelar
          </Link>
          <button
            type="submit"
            className="botao botao--primario botao--compacto"
            disabled={enviando}
          >
            {enviando ? 'Cadastrando...' : 'Cadastrar projeto'}
          </button>
        </div>
      </form>
    </section>
  );
}
