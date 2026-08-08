import 'dotenv/config';

export const PORTA = Number(process.env.PORTA ?? 3000);
export const ORIGEM_FRONTEND = process.env.ORIGEM_FRONTEND ?? 'http://localhost:5173';

export const JWT_SECRET = process.env.JWT_SECRET ?? 'segredo-de-desenvolvimento-do-scientia';
export const JWT_EXPIRACAO = process.env.JWT_EXPIRACAO ?? '2h';

export const ADMIN_INICIAL = {
  nome: process.env.ADMIN_NOME ?? 'Administrador',
  email: process.env.ADMIN_EMAIL ?? 'admin@scientia.ufape.br',
  senha: process.env.ADMIN_SENHA ?? 'admin123',
};

if (!process.env.JWT_SECRET) {
  console.warn('Atenção: JWT_SECRET não foi definido no .env, usando o segredo de desenvolvimento.');
}
