import 'dotenv/config';

export const PORTA = Number(process.env.PORTA ?? 3000);
export const ORIGEM_FRONTEND = process.env.ORIGEM_FRONTEND ?? 'http://localhost:5173';

export const DATABASE_URL = exigirDatabaseUrl();
export const BANCO_SSL = ['true', '1'].includes((process.env.BANCO_SSL ?? '').toLowerCase());

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

function exigirDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL não foi definida. Copie backend/.env.example para backend/.env e configure DATABASE_URL antes de iniciar o backend.',
    );
  }

  return databaseUrl;
}
