import { randomUUID } from 'node:crypto';

export const ROLES = ['ADMIN', 'USER'];

export function novoUsuario({ nome, email, senhaHash, role }) {
  return {
    id: randomUUID(),
    nome,
    email,
    senhaHash,
    role,
    criadoEm: new Date().toISOString(),
  };
}
