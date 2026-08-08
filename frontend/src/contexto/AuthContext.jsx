import { createContext, useContext, useEffect, useState } from 'react';

import * as authService from '../servicos/authService.js';

const CHAVE_TOKEN = 'scientia:token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // O token guardado no navegador pode ter expirado ou ter sido encerrado num
  // logout anterior, então perguntamos ao backend se ele ainda vale antes de
  // considerar o usuário autenticado.
  useEffect(() => {
    const guardado = localStorage.getItem(CHAVE_TOKEN);

    if (!guardado) {
      setCarregando(false);
      return;
    }

    authService
      .perfil(guardado)
      .then((dados) => {
        setToken(guardado);
        setUsuario(dados.usuario);
      })
      .catch(() => localStorage.removeItem(CHAVE_TOKEN))
      .finally(() => setCarregando(false));
  }, []);

  async function entrar(email, senha) {
    abrirSessao(await authService.login(email, senha));
  }

  async function registrar(dadosDoCadastro) {
    abrirSessao(await authService.cadastrar(dadosDoCadastro));
  }

  async function sair() {
    try {
      await authService.logout(token);
    } finally {
      // Mesmo que o servidor recuse o pedido, a sessão local precisa acabar.
      localStorage.removeItem(CHAVE_TOKEN);
      setToken(null);
      setUsuario(null);
    }
  }

  function abrirSessao(dados) {
    localStorage.setItem(CHAVE_TOKEN, dados.token);
    setToken(dados.token);
    setUsuario(dados.usuario);
  }

  const valor = { usuario, token, carregando, entrar, registrar, sair };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro do AuthProvider.');
  }

  return contexto;
}
