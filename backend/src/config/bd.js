import pg from 'pg';
import { BANCO_SSL, DATABASE_URL } from './ambiente.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: BANCO_SSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (erro) => {
  console.error('Erro em conexão ociosa do banco de dados:', erro);
});

export const consultar = (sql, parametros) => pool.query(sql, parametros);

export async function transacao(operacao) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await operacao(cliente);
    await cliente.query('COMMIT');
    cliente.release();
    return resultado;
  } catch (err) {
    const erroOriginal = err;
    try {
      await cliente.query('ROLLBACK');
      cliente.release();
    } catch (rollbackErr) {
      cliente.release(rollbackErr);
    }
    throw erroOriginal;
  }
}

export const encerrarBanco = () => pool.end();
