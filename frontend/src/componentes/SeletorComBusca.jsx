import { useEffect, useState } from 'react';

const ATRASO_BUSCA = 400;

export function SeletorComBusca({
  rotulo,
  placeholder,
  porPagina,
  buscar,
  renderResultado,
  renderEscolhido,
  mensagemCarregando,
  mensagemVazio,
  mensagemErro,
  textoTrocar,
  aoSelecionar,
}) {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [encontrados, setEncontrados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [escolhido, setEscolhido] = useState(null);

  useEffect(() => {
    const temporizador = setTimeout(() => setBuscaAplicada(busca), ATRASO_BUSCA);

    return () => clearTimeout(temporizador);
  }, [busca]);

  useEffect(() => {
    let atual = true;
    setCarregando(true);
    setErro('');

    buscar({ busca: buscaAplicada, porPagina })
      .then((itens) => atual && setEncontrados(itens))
      .catch(() => atual && setErro(mensagemErro))
      .finally(() => atual && setCarregando(false));

    return () => {
      atual = false;
    };
  }, [buscaAplicada]);

  function escolher(item) {
    setEscolhido(item);
    aoSelecionar(item.id);
  }

  function trocar() {
    setEscolhido(null);
    aoSelecionar(null);
  }

  if (escolhido) {
    return (
      <div className="seletor-busca">
        <span className="campo__rotulo">{rotulo}</span>
        <p className="seletor-busca__escolhido">
          {renderEscolhido(escolhido)}
          <button type="button" className="botao botao--discreto" onClick={trocar}>
            {textoTrocar}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="seletor-busca">
      <label className="campo">
        <span>{rotulo}</span>
        <input
          type="search"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder={placeholder}
        />
      </label>

      {carregando && <p className="seletor-busca__estado">{mensagemCarregando}</p>}

      {!carregando && erro && <p className="alerta alerta--erro">{erro}</p>}

      {!carregando && !erro && encontrados.length === 0 && (
        <p className="seletor-busca__estado">{mensagemVazio}</p>
      )}

      {!carregando && !erro && encontrados.length > 0 && (
        <ul className="seletor-busca__resultados">
          {encontrados.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="seletor-busca__resultado"
                onClick={() => escolher(item)}
              >
                {renderResultado(item)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
