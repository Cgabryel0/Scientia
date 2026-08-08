import { Outlet } from 'react-router-dom';

import { Cabecalho } from './Cabecalho.jsx';

/** Moldura das telas internas: cabeçalho fixo e a página da vez no miolo. */
export function Layout() {
  return (
    <div className="layout">
      <Cabecalho />
      <main className="layout__conteudo">
        <Outlet />
      </main>
    </div>
  );
}
