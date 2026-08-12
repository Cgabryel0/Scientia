import { useState } from 'react';

export function AutoresInput({ autores, onChange }) {
  const [valorDigitado, setValorDigitado] = useState('');

  function adicionar() {
    const nome = valorDigitado.trim();
    if (!nome || autores.includes(nome)) {
      return;
    }

    onChange([...autores, nome]);
    setValorDigitado('');
  }

  function remover(nome) {
    onChange(autores.filter((autor) => autor !== nome));
  }

  function aoPressionarTecla(evento) {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      adicionar();
    }
  }

  return (
    <div className="campo">
      <span>Autores</span>

      <div className="entrada-chips">
        <input
          type="text"
          value={valorDigitado}
          onChange={(evento) => setValorDigitado(evento.target.value)}
          onKeyDown={aoPressionarTecla}
          placeholder="Nome do autor e Enter"
        />
        <button type="button" className="botao botao--discreto" onClick={adicionar}>
          Adicionar
        </button>
      </div>

      {autores.length > 0 && (
        <ul className="lista-chips">
          {autores.map((autor) => (
            <li key={autor} className="chip">
              {autor}
              <button
                type="button"
                className="chip__remover"
                onClick={() => remover(autor)}
                aria-label={`Remover ${autor}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
