import { useState } from 'react';

export function PalavrasChaveInput({ palavrasChave, onChange }) {
  const [valorDigitado, setValorDigitado] = useState('');

  function adicionar() {
    const palavra = valorDigitado.trim().toLowerCase();
    if (!palavra || palavrasChave.includes(palavra)) {
      return;
    }

    onChange([...palavrasChave, palavra]);
    setValorDigitado('');
  }

  function remover(palavra) {
    onChange(palavrasChave.filter((item) => item !== palavra));
  }

  function aoPressionarTecla(evento) {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      adicionar();
    }
  }

  return (
    <div className="campo">
      <span>Palavras-chave</span>

      <div className="entrada-chips">
        <input
          type="text"
          value={valorDigitado}
          onChange={(evento) => setValorDigitado(evento.target.value)}
          onKeyDown={aoPressionarTecla}
          placeholder="Palavra-chave e Enter"
        />
        <button type="button" className="botao botao--discreto" onClick={adicionar}>
          Adicionar
        </button>
      </div>

      {palavrasChave.length > 0 && (
        <ul className="lista-chips">
          {palavrasChave.map((palavra) => (
            <li key={palavra} className="chip">
              {palavra}
              <button
                type="button"
                className="chip__remover"
                onClick={() => remover(palavra)}
                aria-label={`Remover ${palavra}`}
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
