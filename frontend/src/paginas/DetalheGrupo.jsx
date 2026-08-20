import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import * as grupoService from '../servicos/grupoService.js';
import { ROTULOS_PAPEL, ROTULOS_STATUS } from '../utils/acervo.js';

export function DetalheGrupo() {
  const { id } = useParams();

  const [grupo, setGrupo] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let atual = true;
    setCarregando(true);
    setErro('');

    grupoService
      .buscarPorId(id)
      .then((dados) => atual && setGrupo(dados.grupo))
      .catch((falha) => atual && setErro(falha.message))
      .finally(() => atual && setCarregando(false));

    return () => {
      atual = false;
    };
  }, [id]);

  if (carregando) {
    return <p className="aviso-carregando">Carregando grupo...</p>;
  }

  if (erro) {
    return (
      <section>
        <p className="alerta alerta--erro">{erro}</p>
        <Link to="/grupos">Voltar para a lista de grupos</Link>
      </section>
    );
  }

  if (!grupo) {
    return null;
  }

  return (
    <section className="detalhe">
      <Link to="/grupos" className="detalhe__voltar">
        ← Grupos
      </Link>

      <div className="detalhe__cabecalho">
        <h1 className="pagina__titulo">{grupo.nome}</h1>
        <span className="etiqueta etiqueta--tipo">Desde {grupo.anoCriacao}</span>
      </div>

      {grupo.linkDgp ? (
        <p className="pagina__descricao">
          <a href={grupo.linkDgp} target="_blank" rel="noopener noreferrer">
            Perfil no Diretório de Grupos
          </a>
        </p>
      ) : (
        <p className="pagina__descricao">Grupo sem perfil no Diretório de Grupos.</p>
      )}

      <div className="cartoes">
        <article className="cartao">
          <h2>Membros</h2>
          {grupo.membros.length === 0 ? (
            <p>Nenhum membro vinculado ao grupo.</p>
          ) : (
            <ul className="lista-pessoas">
              {grupo.membros.map((membro) => (
                <li key={membro.id} className="lista-pessoas__item">
                  <span className="lista-pessoas__nome">{membro.nome}</span>
                  <span className={`etiqueta etiqueta--papel etiqueta--${membro.papel}`}>
                    {ROTULOS_PAPEL[membro.papel] ?? membro.papel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="cartao">
          <h2>Projetos</h2>
          {grupo.projetos.length === 0 ? (
            <p>Nenhum projeto vinculado ao grupo.</p>
          ) : (
            <ul className="lista-pessoas">
              {grupo.projetos.map((projeto) => (
                <li key={projeto.id} className="lista-pessoas__item">
                  <Link className="lista-pessoas__nome" to={`/projetos/${projeto.id}`}>
                    {projeto.titulo}
                  </Link>
                  <span className={`etiqueta etiqueta--situacao etiqueta--${projeto.status}`}>
                    {ROTULOS_STATUS[projeto.status] ?? projeto.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
