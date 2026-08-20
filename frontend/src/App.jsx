import { Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from './componentes/Layout.jsx';
import { RotaProtegida } from './componentes/RotaProtegida.jsx';
import { Cadastro } from './paginas/Cadastro.jsx';
import { CadastroProducao } from './paginas/CadastroProducao.jsx';
import { Login } from './paginas/Login.jsx';
import { Painel } from './paginas/Painel.jsx';
import { Producoes } from './paginas/Producoes.jsx';
import { SemPermissao } from './paginas/SemPermissao.jsx';
import { Usuarios } from './paginas/Usuarios.jsx';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      {/* Daqui para baixo tudo exige sessão; a rota de usuários pede também o
          tipo admin, com um segundo guard por dentro. */}
      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/painel" element={<Painel />} />
          <Route path="/producoes" element={<Producoes />} />
          <Route path="/producoes/cadastro" element={<CadastroProducao />} />
          <Route path="/sem-permissao" element={<SemPermissao />} />

          <Route element={<RotaProtegida tipos={['admin']} />}>
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/painel" replace />} />
    </Routes>
  );
}
