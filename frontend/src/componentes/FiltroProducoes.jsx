import { TIPOS_TRABALHO } from '../utils/validacaoProducao.js';

export function FiltroProducoes({ filtros, onChange, onLimpar }) {
  const lidarComMudanca = (e) => {
    const { name, value } = e.target;
    onChange({ ...filtros, [name]: value });
  };

  // Garante que a iteração funcione seja TIPOS_TRABALHO um Array ou Objeto
  const opcoesTipos = Array.isArray(TIPOS_TRABALHO) ? TIPOS_TRABALHO : Object.values(TIPOS_TRABALHO || {});

  return (
    <div className="filtro-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
      <label className="campo">
        <span>Título</span>
        <input
          type="text"
          name="titulo"
          placeholder="Buscar por título..."
          value={filtros.titulo}
          onChange={lidarComMudanca}
        />
      </label>

      <label className="campo">
        <span>Autor</span>
        <input
          type="text"
          name="autor"
          placeholder="Buscar por autor..."
          value={filtros.autor}
          onChange={lidarComMudanca}
        />
      </label>

      <label className="campo">
        <span>Tipo de Trabalho</span>
        <select name="tipoTrabalho" value={filtros.tipoTrabalho} onChange={lidarComMudanca}>
          <option value="">Todos os Tipos</option>
          {opcoesTipos.map((tipo) => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </label>

      <label className="campo">
        <span>Palavra-chave</span>
        <input
          type="text"
          name="palavraChave"
          placeholder="Ex: IA"
          value={filtros.palavraChave}
          onChange={lidarComMudanca}
        />
      </label>

      <label className="campo">
        <span>Ano</span>
        <input
          type="number"
          name="anoPublicacao"
          placeholder="Ex: 2024"
          value={filtros.anoPublicacao}
          onChange={lidarComMudanca}
        />
      </label>

      <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '5px' }}>
        <button onClick={onLimpar} className="botao">Limpar Filtros</button>
      </div>
    </div>
  );
}
