export function ProducaoCard({ producao, onSelecionar }) {
  return (
    <div 
      className="producao-card" 
      onClick={() => onSelecionar(producao.id)} 
      style={{ cursor: 'pointer', border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}
    >
      <h3>{producao.titulo}</h3>
      <p><strong>Autores:</strong> {producao.autores.join(', ')}</p>
      <p><strong>Tipo:</strong> {producao.tipoTrabalho}</p>
      <p><strong>Ano:</strong> {producao.anoPublicacao}</p>
      <div className="chips" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
        {producao.palavrasChave.map((palavra, index) => (
          <span key={index} className="chip">{palavra}</span>
        ))}
      </div>
    </div>
  );
}
