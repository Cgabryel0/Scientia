import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../contexto/AuthContext.jsx';
import * as areaService from '../servicos/areaService.js';
import * as editalService from '../servicos/editalService.js';
import * as grupoService from '../servicos/grupoService.js';
import * as projetoService from '../servicos/projetoService.js';
import { ROTULOS_STATUS } from '../utils/acervo.js';
import { validarProjeto } from '../utils/validacaoProjeto.js';

export function EditarProjeto() {
  const { id } = useParams();
  const { token } = useAuth();
  const navegar = useNavigate();
  const [dados, setDados] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [editais, setEditais] = useState([]);
  const [areasEscolhidas, setAreasEscolhidas] = useState([]);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let atual = true;

    Promise.all([
      projetoService.buscarPorId(id),
      grupoService.listar({ porPagina: 100 }),
      areaService.listar(),
      editalService.listar(),
    ])
      .then(([respostaProjeto, respostaGrupos, respostaAreas, respostaEditais]) => {
        if (!atual) {
          return;
        }

        const projeto = respostaProjeto.projeto;
        setDados({
          titulo: projeto.titulo,
          resumo: projeto.resumo ?? '',
          dataInicio: projeto.dataInicio,
          dataFim: projeto.dataFim ?? '',
          status: projeto.status,
          idGrupo: String(projeto.grupo.id),
          idEdital: projeto.edital ? String(projeto.edital.id) : '',
        });
        setAreasEscolhidas(projeto.areas.map((area) => area.id));
        setGrupos(respostaGrupos.grupos);
        setAreas(respostaAreas.areas);
        setEditais(respostaEditais.editais);
      })
      .catch((falha) => atual && setErro(falha.message));

    return () => {
      atual = false;
    };
  }, [id]);

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
      idGrupo: Number(dados.idGrupo),
      idEdital: dados.idEdital ? Number(dados.idEdital) : null,
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
      await projetoService.atualizar(id, corpo, token);
      navegar(`/projetos/${id}`);
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  }

  if (!dados && !erro) {
    return <p className="aviso-carregando">Carregando projeto...</p>;
  }

  return (
    <section>
      <h1 className="pagina__titulo">Editar projeto</h1>
      <p className="pagina__descricao">
        Atualize os dados principais e as áreas vinculadas ao projeto.
      </p>
      {erro && <p className="alerta alerta--erro">{erro}</p>}

      {dados && (
        <form className="formulario-acervo" onSubmit={enviar}>
          <label className="campo">
            <span>Título</span>
            <input
              name="titulo"
              value={dados.titulo}
              onChange={alterar}
              maxLength={255}
            />
          </label>

          <label className="campo">
            <span>Resumo</span>
            <textarea name="resumo" value={dados.resumo} onChange={alterar} rows={5} />
          </label>

          <div className="formulario-acervo__linha">
            <label className="campo">
              <span>Data de início</span>
              <input
                type="date"
                name="dataInicio"
                value={dados.dataInicio}
                onChange={alterar}
              />
            </label>

            <label className="campo">
              <span>Data de fim</span>
              <input type="date" name="dataFim" value={dados.dataFim} onChange={alterar} />
            </label>
          </div>

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
            <span>Grupo</span>
            <select name="idGrupo" value={dados.idGrupo} onChange={alterar}>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="campo">
            <span>Edital</span>
            <select name="idEdital" value={dados.idEdital} onChange={alterar}>
              <option value="">Sem edital</option>
              {editais.map((edital) => (
                <option key={edital.id} value={edital.id}>
                  {edital.nome} ({edital.ano})
                </option>
              ))}
            </select>
          </label>

          <fieldset className="selecao-areas">
            <legend>Áreas do conhecimento</legend>
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
            <Link to={`/projetos/${id}`} className="botao botao--discreto">
              Cancelar
            </Link>
            <button
              type="submit"
              className="botao botao--primario botao--compacto"
              disabled={enviando}
            >
              {enviando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
