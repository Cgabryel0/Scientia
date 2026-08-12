import { requisitar } from './api.js';

export function cadastrar({ nome, email, senha, role }) {
  return requisitar('/auth/cadastro', { metodo: 'POST', corpo: { nome, email, senha, role } });
}

export function login(email, senha) {
  return requisitar('/auth/login', { metodo: 'POST', corpo: { email, senha } });
}

export function logout(token) {
  return requisitar('/auth/logout', { metodo: 'POST', token });
}

export function perfil(token) {
  return requisitar('/auth/perfil', { token });
}
