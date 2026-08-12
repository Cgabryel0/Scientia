import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexto/AuthContext.jsx';

const DADOS_INICIAIS = { nome: '', email: '', senha: '', role: 'USER' };

export function Cadastro() {
  const { usuario, registrar } = useAuth();
  const navegar = useNavigate();

  const [dados, setDados] = useState(DADOS_INICIAIS);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) {
    return <Navigate to="/painel" replace />;
  }

  function alterar(evento) {
    const { name, value } = evento.target;
    setDados((anterior) => ({ ...anterior, [name]: value }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);

    try {
      await registrar(dados);
      navegar('/painel', { replace: true });
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  }

  return (
    <div className="tela-auth">
      <form className="cartao-auth" onSubmit={enviar}>
        <h1 className="cartao-auth__titulo">Criar conta</h1>
        <p className="cartao-auth__subtitulo">
          Preencha os dados abaixo para começar a usar o sistema.
        </p>

        {erro && <p className="alerta alerta--erro">{erro}</p>}

        <label className="campo">
          <span>Nome</span>
          <input
            type="text"
            name="nome"
            value={dados.nome}
            onChange={alterar}
            placeholder="Como você quer ser identificado"
            required
          />
        </label>

        <label className="campo">
          <span>E-mail</span>
          <input
            type="email"
            name="email"
            value={dados.email}
            onChange={alterar}
            placeholder="voce@ufape.br"
            autoComplete="email"
            required
          />
        </label>

        <label className="campo">
          <span>Senha</span>
          <input
            type="password"
            name="senha"
            value={dados.senha}
            onChange={alterar}
            placeholder="No mínimo 6 caracteres"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>

        <label className="campo">
          <span>Papel</span>
          <select name="role" value={dados.role} onChange={alterar}>
            <option value="USER">USER - consulta o acervo</option>
            <option value="ADMIN">ADMIN - administra o sistema</option>
          </select>
        </label>

        <button type="submit" className="botao botao--primario" disabled={enviando}>
          {enviando ? 'Cadastrando...' : 'Cadastrar'}
        </button>

        <p className="cartao-auth__rodape">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
