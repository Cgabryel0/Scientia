import { Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from './componentes/Layout.jsx';
import { RotaProtegida } from './componentes/RotaProtegida.jsx';
import { Cadastro } from './paginas/Cadastro.jsx';
import { CadastroProjeto } from './paginas/CadastroProjeto.jsx';
import { CadastroPublicacao } from './paginas/CadastroPublicacao.jsx';
import { DetalheGrupo } from './paginas/DetalheGrupo.jsx';
import { DetalheProjeto } from './paginas/DetalheProjeto.jsx';
import { EditarProjeto } from './paginas/EditarProjeto.jsx';
import { EditarPublicacao } from './paginas/EditarPublicacao.jsx';
import { Grupos } from './paginas/Grupos.jsx';
import { FormularioGrupo } from './paginas/FormularioGrupo.jsx';
import { Login } from './paginas/Login.jsx';
import { Painel } from './paginas/Painel.jsx';
import { Projetos } from './paginas/Projetos.jsx';
import { Publicacoes } from './paginas/Publicacoes.jsx';
import { SemPermissao } from './paginas/SemPermissao.jsx';
import { Usuarios } from './paginas/Usuarios.jsx';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      <Route element={<Layout />}>
        <Route path="/publicacoes" element={<Publicacoes />} />
        <Route path="/projetos" element={<Projetos />} />
        <Route path="/projetos/:id" element={<DetalheProjeto />} />
        <Route path="/grupos" element={<Grupos />} />
        <Route path="/grupos/:id" element={<DetalheGrupo />} />
      </Route>

      {/* Daqui para baixo tudo exige sessão; a rota de usuários pede também o
          tipo admin, com um segundo guard por dentro. */}
      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/painel" element={<Painel />} />
          <Route path="/sem-permissao" element={<SemPermissao />} />

          <Route element={<RotaProtegida tipos={['pesquisador', 'admin']} />}>
            <Route path="/publicacoes/cadastro" element={<CadastroPublicacao />} />
            <Route path="/projetos/cadastro" element={<CadastroProjeto />} />
            <Route path="/projetos/:id/editar" element={<EditarProjeto />} />
            <Route path="/publicacoes/:id/editar" element={<EditarPublicacao />} />
            <Route path="/grupos/cadastro" element={<FormularioGrupo />} />
            <Route path="/grupos/:id/editar" element={<FormularioGrupo />} />
          </Route>

          <Route element={<RotaProtegida tipos={['admin']} />}>
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/publicacoes" replace />} />
    </Routes>
  );
}
