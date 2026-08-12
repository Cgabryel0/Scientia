import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiltroProducoes } from '../componentes/FiltroProducoes.jsx';
import { ProducaoCard } from '../componentes/ProducaoCard.jsx';
import { listar } from '../servicos/producaoConsultaService.js';
import { AuthContext } from '../contexto/AuthContext.jsx';

export function Producoes() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  
  const estadoInicialFiltros = {
    titulo: '',
    autor: '',
    tipoTrabalho: '',
    palavraChave: '',
    anoPublicacao: ''
  };

  const [producoes, setProducoes] = useState([]);
  const [filtros, setFiltros] = useState(estadoInicialFiltros);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const buscarProducoes = async () => {
      setCarregando(true);
      setErro('');
      try {
        const dados = await listar(filtros, token);
        setProducoes(dados.producoes || []);
      } catch (err) {
        setErro(err.message || 'Não foi possível carregar as produções científicas.');
      } finally {
        setCarregando(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      buscarProducoes();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [filtros, token]);

  const limparFiltros = () => setFiltros(estadoInicialFiltros);
  const irParaDetalhes = (id) => navigate(`/producoes/${id}`);

  return (
    <div className="producoes-container">
      <h1 className="pagina__titulo">Acervo Científico</h1>
      
      <div className="acoes-topo" style={{ marginBottom: '20px' }}>
        <button className="botao botao--primario" onClick={() => navigate('/producoes/nova')}>
          Nova Produção
        </button>
      </div>

      <FiltroProducoes filtros={filtros} onChange={setFiltros} onLimpar={limparFiltros} />

      {erro && <p className="alerta alerta--erro">{erro}</p>}
      {carregando && <p className="aviso-carregando">Carregando produções...</p>}
      
      {!carregando && !erro && producoes.length === 0 && (
        <p className="aviso-carregando">Nenhuma produção encontrada.</p>
      )}

      <div className="grid-producoes" style={{ marginTop: '20px' }}>
        {producoes.map((producao) => (
          <ProducaoCard 
            key={producao.id} 
            producao={producao} 
            onSelecionar={irParaDetalhes} 
          />
        ))}
      </div>
    </div>
  );
}
