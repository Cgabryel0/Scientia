import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AutoresInput } from '../componentes/AutoresInput.jsx';
import { PalavrasChaveInput } from '../componentes/PalavrasChaveInput.jsx';
import { ProducaoForm } from '../componentes/ProducaoForm.jsx';
import { useAuth } from '../contexto/AuthContext.jsx';
import * as producaoCadastroService from '../servicos/producaoCadastroService.js';
import { validarFormulario } from '../utils/validacaoProducao.js';

const DADOS_INICIAIS = {
  titulo: '',
  tipoTrabalho: 'ARTIGO',
  resumo: '',
  anoPublicacao: '',
  arquivoOuLink: '',
};

export function CadastroProducao() {
  const { token } = useAuth();
  const navegar = useNavigate();

  const [dados, setDados] = useState(DADOS_INICIAIS);
  const [autores, setAutores] = useState([]);
  const [palavrasChave, setPalavrasChave] = useState([]);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  function alterar(evento) {
    const { name, value } = evento.target;
    setDados((anterior) => ({ ...anterior, [name]: value }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErroGeral('');

    const producaoCompleta = { ...dados, autores, palavrasChave };
    const errosDeValidacao = validarFormulario(producaoCompleta);

    if (Object.keys(errosDeValidacao).length > 0) {
      setErros(errosDeValidacao);
      return;
    }

    setErros({});
    setEnviando(true);

    try {
      await producaoCadastroService.cadastrar(producaoCompleta, token);
      navegar('/producoes', { replace: true });
    } catch (falha) {
      setErroGeral(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section>
      <h1 className="pagina__titulo">Cadastrar produção científica</h1>
      <p className="pagina__descricao">
        Preencha os dados abaixo para adicionar uma produção ao acervo do curso.
      </p>

      <form className="cartao-producao" onSubmit={enviar}>
        {erroGeral && <p className="alerta alerta--erro">{erroGeral}</p>}

        <ProducaoForm dados={dados} onChange={alterar} erros={erros} />

        <AutoresInput autores={autores} onChange={setAutores} />
        {erros.autores && <p className="campo__erro">{erros.autores}</p>}

        <PalavrasChaveInput palavrasChave={palavrasChave} onChange={setPalavrasChave} />
        {erros.palavrasChave && <p className="campo__erro">{erros.palavrasChave}</p>}

        <button type="submit" className="botao botao--primario" disabled={enviando}>
          {enviando ? 'Cadastrando...' : 'Cadastrar produção'}
        </button>
      </form>
    </section>
  );
}
