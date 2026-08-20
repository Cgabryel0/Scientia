import { useEffect, useState } from 'react';

import { useAuth } from '../contexto/AuthContext.jsx';
import * as usuarioService from '../servicos/usuarioService.js';

export function Usuarios() {
  const { token } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    usuarioService
      .listar(token)
      .then((dados) => setUsuarios(dados.usuarios))
      .catch((falha) => setErro(falha.message))
      .finally(() => setCarregando(false));
  }, [token]);

  return (
    <section>
      <h1 className="pagina__titulo">Usuários cadastrados</h1>
      <p className="pagina__descricao">
        Endpoint restrito ao tipo admin, tanto no guard da rota quanto no backend.
      </p>

      {erro && <p className="alerta alerta--erro">{erro}</p>}
      {carregando && <p className="aviso-carregando">Carregando usuários...</p>}

      {!carregando && !erro && (
        <div className="tabela-container">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Tipo</th>
                <th>Cadastrado em</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((item) => (
                <tr key={item.id}>
                  <td>{item.nome}</td>
                  <td>{item.email}</td>
                  <td>
                    <span className={`etiqueta etiqueta--${item.tipo}`}>
                      {item.tipo}
                    </span>
                  </td>
                  <td>{new Date(item.criadoEm).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
