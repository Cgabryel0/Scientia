import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Publicacoes } from './Publicacoes.jsx';
import * as pesquisadorService from '../servicos/pesquisadorService.js';
import { ROTULOS_VINCULO } from '../utils/acervo.js';

export function PerfilPesquisador() {
  const { id } = useParams();

  const [pesquisador, setPesquisador] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let atual = true;
    setCarregando(true);
    setErro('');

    pesquisadorService
      .obterPorId(id)
      .then((dados) => atual && setPesquisador(dados))
      .catch((falha) => atual && setErro(falha.message))
      .finally(() => atual && setCarregando(false));

    return () => {
      atual = false;
    };
  }, [id]);

  if (carregando) {
    return <p className="aviso-carregando">Carregando perfil...</p>;
  }

  if (erro) {
    return (
      <section>
        <p className="alerta alerta--erro">{erro}</p>
        <Link to="/publicacoes">Ir para a lista de publicações</Link>
      </section>
    );
  }

  if (!pesquisador) {
    return null;
  }

  return (
    <section className="detalhe">
      <div className="detalhe__cabecalho">
        <h1 className="pagina__titulo">{pesquisador.nome}</h1>
        <div className="detalhe__tags">
          <span className="detalhe__tag detalhe__tag--sucesso">
            {ROTULOS_VINCULO[pesquisador.vinculo] ?? pesquisador.vinculo}
          </span>
        </div>
      </div>

      <div className="detalhe__campos">
        <div className="detalhe__campo">
          <strong>Lattes:</strong>
          <span>{pesquisador.numeroLattes}</span>
        </div>
      </div>

      <div className="detalhe__secao">
        <h2>Produção Científica</h2>
        <Publicacoes idPesquisadorFixo={pesquisador.id} />
      </div>
    </section>
  );
}
