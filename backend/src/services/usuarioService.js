import bcrypt from 'bcryptjs';

import { ADMIN_INICIAL } from '../config/ambiente.js';
import { ErroHttp } from '../erros/ErroHttp.js';
import { ROLES, novoUsuario } from '../models/Usuario.js';
import * as repositorio from '../models/repositorioUsuarios.js';

const TAMANHO_MINIMO_SENHA = 6;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function cadastrar({ nome, email, senha, role }) {
  validarDadosDoCadastro({ nome, email, senha, role });

  if (repositorio.buscarPorEmail(email)) {
    throw new ErroHttp(409, 'Já existe uma conta cadastrada com esse e-mail.');
  }

  const usuario = novoUsuario({
    nome: nome.trim(),
    email: repositorio.normalizarEmail(email),
    senhaHash: await bcrypt.hash(senha, 10),
    role,
  });

  return repositorio.salvar(usuario);
}

export async function autenticar(email, senha) {
  // A mesma mensagem vale para e-mail inexistente e senha errada, para não
  // revelar a quem está tentando adivinhar quais e-mails estão cadastrados.
  const credenciaisInvalidas = new ErroHttp(401, 'E-mail ou senha inválidos.');

  const usuario = repositorio.buscarPorEmail(email);
  if (!usuario) {
    throw credenciaisInvalidas;
  }

  const senhaConfere = await bcrypt.compare(String(senha ?? ''), usuario.senhaHash);
  if (!senhaConfere) {
    throw credenciaisInvalidas;
  }

  return usuario;
}

export function buscarPorId(id) {
  const usuario = repositorio.buscarPorId(id);
  if (!usuario) {
    throw new ErroHttp(404, 'Usuário não encontrado.');
  }
  return usuario;
}

export function listar() {
  return repositorio.listarTodos();
}

/** Cria a conta de administrador na subida do servidor, se ela ainda não existe. */
export async function garantirAdminInicial() {
  if (repositorio.buscarPorEmail(ADMIN_INICIAL.email)) {
    return;
  }

  await cadastrar({ ...ADMIN_INICIAL, role: 'ADMIN' });
  console.log(`Administrador inicial disponível: ${ADMIN_INICIAL.email}`);
}

function validarDadosDoCadastro({ nome, email, senha, role }) {
  const problemas = [];

  if (!nome || nome.trim().length < 3) {
    problemas.push('O nome precisa ter pelo menos 3 caracteres.');
  }

  if (!FORMATO_EMAIL.test(String(email ?? '').trim())) {
    problemas.push('Informe um e-mail válido.');
  }

  if (!senha || senha.length < TAMANHO_MINIMO_SENHA) {
    problemas.push(`A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
  }

  if (!ROLES.includes(role)) {
    problemas.push(`O papel deve ser ${ROLES.join(' ou ')}.`);
  }

  if (problemas.length > 0) {
    throw new ErroHttp(400, problemas.join(' '));
  }
}
