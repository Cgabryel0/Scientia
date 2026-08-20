import bcrypt from 'bcryptjs';

import { ADMIN_INICIAL } from '../config/ambiente.js';
import { transacao } from '../config/bd.js';
import { ErroHttp } from '../erros/ErroHttp.js';
import * as repositorioCursos from '../models/repositorioCursos.js';
import * as repositorioUsuarios from '../models/repositorioUsuarios.js';

const TAMANHO_MINIMO_SENHA = 6;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIPOS_CADASTRO = ['aluno', 'pesquisador'];
const VINCULOS_PESQUISADOR = ['docente', 'discente', 'externo'];
const HASH_DUMMY_AUTENTICACAO = '$2b$10$1sOjgIPs9/ewWhYWL9EJvu0xDWtQtbWqKKc1YMh0pn9h1x87NlEya';
const CAMPOS_TEXTO_CADASTRO = ['tipo', 'nome', 'email', 'senha', 'matricula', 'numeroLattes', 'vinculo'];

export async function cadastrar(dados) {
  const dadosCadastro = dados ?? {};
  validarTiposDoCadastro(dadosCadastro);
  const cadastro = normalizarCadastro(dadosCadastro);
  validarDadosDoCadastro(cadastro);

  if (await repositorioUsuarios.buscarPorEmail(cadastro.email)) {
    throw new ErroHttp(409, 'Já existe uma conta com esse email.');
  }

  if (cadastro.tipo === 'aluno') {
    return cadastrarAluno(cadastro);
  }

  return cadastrarPesquisador(cadastro);
}

export async function autenticar(email, senha) {
  const credenciaisInvalidas = new ErroHttp(401, 'Email ou senha incorretos.');
  const usuario = await repositorioUsuarios.buscarPorEmail(email);
  const senhaHash = usuario?.senhaHash ?? HASH_DUMMY_AUTENTICACAO;
  const senhaConfere = await bcrypt.compare(String(senha ?? ''), senhaHash);

  if (!usuario || !senhaConfere) {
    throw credenciaisInvalidas;
  }

  return aplicarNomeAdmin(usuario);
}

export async function buscarPorId(id) {
  const usuario = await repositorioUsuarios.buscarPorId(id);
  if (!usuario) {
    throw new ErroHttp(404, 'Usuário não encontrado.');
  }

  return aplicarNomeAdmin(usuario);
}

export async function buscarPerfilPorId(id) {
  const usuario = await repositorioUsuarios.buscarPerfilPorId(id);
  if (!usuario) {
    throw new ErroHttp(404, 'Usuário não encontrado.');
  }

  return aplicarNomeAdmin(usuario);
}

export async function listar() {
  const usuarios = await repositorioUsuarios.listarTodos();
  return usuarios.map(aplicarNomeAdmin);
}

export async function garantirAdminInicial() {
  if (await repositorioUsuarios.buscarPorEmail(ADMIN_INICIAL.email)) {
    return;
  }

  await transacao(async (cliente) => {
    await repositorioUsuarios.criarConta(cliente, {
      email: ADMIN_INICIAL.email,
      senhaHash: await bcrypt.hash(ADMIN_INICIAL.senha, 10),
      tipo: 'admin',
    });
  });

  console.log(`Administrador inicial disponível: ${ADMIN_INICIAL.email}`);
}

async function cadastrarAluno(cadastro) {
  if (!(await repositorioCursos.buscarPorId(cadastro.idCurso))) {
    throw new ErroHttp(400, 'Curso não encontrado.');
  }

  if (await repositorioUsuarios.buscarAlunoPorMatricula(cadastro.matricula)) {
    throw new ErroHttp(409, 'Já existe um aluno com essa matrícula.');
  }

  return executarCadastro(async (cliente) => {
    const conta = await criarContaDoCadastro(cliente, cadastro);
    await repositorioUsuarios.criarAluno(cliente, {
      idConta: conta.id,
      idCurso: cadastro.idCurso,
      nome: cadastro.nome,
      matricula: cadastro.matricula,
    });

    return repositorioUsuarios.buscarUsuarioPorId(cliente, conta.id);
  });
}

async function cadastrarPesquisador(cadastro) {
  const pesquisador = await repositorioUsuarios.buscarPesquisadorPorLattes(cadastro.numeroLattes);
  if (pesquisador?.idConta) {
    throw new ErroHttp(409, 'Esse número Lattes já pertence a outra conta.');
  }

  return executarCadastro(async (cliente) => {
    const conta = await criarContaDoCadastro(cliente, cadastro);

    if (pesquisador) {
      const vinculado = await repositorioUsuarios.vincularPesquisador(cliente, {
        idConta: conta.id,
        numeroLattes: cadastro.numeroLattes,
      });

      if (!vinculado) {
        throw new ErroHttp(409, 'Esse número Lattes já pertence a outra conta.');
      }
    } else {
      await repositorioUsuarios.criarPesquisador(cliente, {
        idConta: conta.id,
        nome: cadastro.nome,
        email: cadastro.email,
        numeroLattes: cadastro.numeroLattes,
        vinculo: cadastro.vinculo,
      });
    }

    return repositorioUsuarios.buscarUsuarioPorId(cliente, conta.id);
  });
}

async function criarContaDoCadastro(cliente, cadastro) {
  return repositorioUsuarios.criarConta(cliente, {
    email: cadastro.email,
    senhaHash: await bcrypt.hash(cadastro.senha, 10),
    tipo: cadastro.tipo,
  });
}

async function executarCadastro(operacao) {
  try {
    const usuario = await transacao(operacao);
    return aplicarNomeAdmin(usuario);
  } catch (erro) {
    if (erro.code === '23505') {
      tratarConflitoUnico(erro);
    }

    throw erro;
  }
}

function tratarConflitoUnico(erro) {
  const restricao = erro.constraint;

  if (restricao === 'uq_conta_email') {
    throw new ErroHttp(409, 'Já existe uma conta com esse email.');
  }

  if (restricao === 'uq_aluno_matricula') {
    throw new ErroHttp(409, 'Já existe um aluno com essa matrícula.');
  }

  if (restricao === 'uq_pesquisador_lattes') {
    throw new ErroHttp(409, 'Esse número Lattes já pertence a outra conta.');
  }
}

function validarTiposDoCadastro(dados) {
  const campoTextoInvalido = CAMPOS_TEXTO_CADASTRO.some(
    (campo) => dados[campo] != null && typeof dados[campo] !== 'string',
  );
  const idCursoInvalido =
    dados.idCurso != null &&
    !(
      (typeof dados.idCurso === 'number' && Number.isFinite(dados.idCurso)) ||
      (typeof dados.idCurso === 'string' &&
        dados.idCurso.trim() !== '' &&
        Number.isFinite(Number(dados.idCurso.trim())))
    );

  if (campoTextoInvalido || idCursoInvalido) {
    throw new ErroHttp(400, 'Campos de cadastro inválidos.');
  }
}

function normalizarCadastro(dados = {}) {
  return {
    tipo: String(dados.tipo ?? '').trim(),
    nome: String(dados.nome ?? '').trim(),
    email: repositorioUsuarios.normalizarEmail(dados.email),
    senha: String(dados.senha ?? ''),
    matricula: String(dados.matricula ?? '').trim(),
    idCurso: Number(dados.idCurso),
    numeroLattes: String(dados.numeroLattes ?? '').trim(),
    vinculo: String(dados.vinculo ?? '').trim(),
  };
}

function validarDadosDoCadastro(cadastro) {
  const problemas = [];

  if (!TIPOS_CADASTRO.includes(cadastro.tipo)) {
    problemas.push('O tipo deve ser aluno ou pesquisador.');
  }

  if (!cadastro.nome) {
    problemas.push('Informe o nome.');
  }

  if (!cadastro.email) {
    problemas.push('Informe o email.');
  } else if (!FORMATO_EMAIL.test(cadastro.email)) {
    problemas.push('Informe um email válido.');
  }

  if (!cadastro.senha) {
    problemas.push('Informe a senha.');
  } else if (cadastro.senha.length < TAMANHO_MINIMO_SENHA) {
    problemas.push(`A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
  }

  validarComprimentosDoCadastro(cadastro, problemas);
  validarDadosDoPerfil(cadastro, problemas);

  if (problemas.length > 0) {
    throw new ErroHttp(400, problemas.join(' '));
  }
}

function validarComprimentosDoCadastro(cadastro, problemas) {
  if (cadastro.nome.length > 150) {
    problemas.push('O nome deve ter no máximo 150 caracteres.');
  }

  if (cadastro.email.length > 150) {
    problemas.push('O email deve ter no máximo 150 caracteres.');
  }

  if (cadastro.matricula.length > 30) {
    problemas.push('A matrícula deve ter no máximo 30 caracteres.');
  }

  if (cadastro.numeroLattes.length > 50) {
    problemas.push('O número Lattes deve ter no máximo 50 caracteres.');
  }
}

function validarDadosDoPerfil(cadastro, problemas) {
  if (cadastro.tipo === 'aluno') {
    if (!cadastro.matricula) {
      problemas.push('Informe a matrícula.');
    }

    if (!Number.isInteger(cadastro.idCurso) || cadastro.idCurso <= 0) {
      problemas.push('Informe um curso válido.');
    }
  }

  if (cadastro.tipo === 'pesquisador') {
    if (!cadastro.numeroLattes) {
      problemas.push('Informe o número Lattes.');
    }

    if (!VINCULOS_PESQUISADOR.includes(cadastro.vinculo)) {
      problemas.push('O vínculo deve ser docente, discente ou externo.');
    }
  }
}

function aplicarNomeAdmin(usuario) {
  if (!usuario || usuario.tipo !== 'admin') {
    return usuario;
  }

  return {
    ...usuario,
    nome: ADMIN_INICIAL.nome,
  };
}
