import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { AutoresPesquisadorInput } from '../componentes/AutoresPesquisadorInput.jsx';
import { useAuth } from '../contexto/AuthContext.jsx';
import * as projetoService from '../servicos/projetoService.js';
import * as publicacaoService from '../servicos/publicacaoService.js';
import { ROTULOS_TIPO } from '../utils/acervo.js';
import { validarPublicacao } from '../utils/validacaoPublicacao.js';

export function EditarPublicacao() {
  const { id } = useParams();
  const { token } = useAuth();
  const navegar = useNavigate();
  const [dados, setDados] = useState(null);
  const [autores, setAutores] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let atual = true;

    Promise.all([publicacaoService.buscarPorId(id), projetoService.listar({ porPagina: 100 })])
      .then(([respostaPublicacao, respostaProjetos]) => {
        if (!atual) {
          return;
        }

        const publicacao = respostaPublicacao.publicacao;
        setDados({
          titulo: publicacao.titulo,
          tipo: publicacao.tipo,
          ano: String(publicacao.ano),
          doi: publicacao.doi ?? '',
          veiculo: publicacao.veiculo,
          idProjeto: String(publicacao.projeto.id),
        });
        setAutores(publicacao.autores);
        setProjetos(respostaProjetos.projetos);
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

  async function enviar(evento) {
    evento.preventDefault();

    const corpo = {
      titulo: dados.titulo.trim(),
      tipo: dados.tipo,
      ano: Number(dados.ano),
      doi: dados.doi.trim() || null,
      veiculo: dados.veiculo.trim(),
      idProjeto: Number(dados.idProjeto),
      autores: autores.map((autor) =>
        autor.id !== undefined
          ? { id: autor.id }
          : {
              nome: autor.nome,
              numeroLattes: autor.numeroLattes,
              vinculo: autor.vinculo,
              email: autor.email ?? '',
            },
      ),
    };
    const problemas = validarPublicacao(corpo);

    if (problemas.length > 0) {
      setErro(problemas.join(' '));
      return;
    }

    setErro('');
    setEnviando(true);

    try {
      await publicacaoService.atualizar(id, corpo, token);
      navegar('/publicacoes');
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  }

  if (!dados && !erro) {
    return <p className="aviso-carregando">Carregando publicação...</p>;
  }

  return (
    <section>
      <h1 className="pagina__titulo">Editar publicação</h1>
      <p className="pagina__descricao">Atualize os metadados, o projeto e a ordem de autoria.</p>
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
              name="veiculo"
              value={dados.veiculo}
              onChange={alterar}
              maxLength={150}
            />
          </label>

          <label className="campo">
            <span>DOI</span>
            <input name="doi" value={dados.doi} onChange={alterar} maxLength={100} />
          </label>

          <label className="campo">
            <span>Projeto</span>
            <select name="idProjeto" value={dados.idProjeto} onChange={alterar}>
              {projetos.map((projeto) => (
                <option key={projeto.id} value={projeto.id}>
                  {projeto.titulo}
                </option>
              ))}
            </select>
          </label>

          <AutoresPesquisadorInput autoresIniciais={autores} aoAlterar={setAutores} />

          <div className="formulario-acervo__acoes">
            <Link to="/publicacoes" className="botao botao--discreto">
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
