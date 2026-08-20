import cors from 'cors';
import express from 'express';

import { ORIGEM_FRONTEND } from './config/ambiente.js';
import { autenticacao } from './middlewares/autenticacao.js';
import { rotaNaoEncontrada, tratadorDeErros } from './middlewares/erros.js';
import authRoutes from './routes/authRoutes.js';
import cursoRoutes from './routes/cursoRoutes.js';
import producaoRoutes from './routes/producaoRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';

export function criarApp() {
  const app = express();

  app.use(cors({ origin: ORIGEM_FRONTEND }));
  app.use(express.json());

  app.use(autenticacao);

  app.get('/api/status', (req, res) => res.json({ status: 'no ar' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/cursos', cursoRoutes);
  app.use('/api/producoes', producaoRoutes);
  app.use('/api/usuarios', usuarioRoutes);

  app.use(rotaNaoEncontrada);
  app.use(tratadorDeErros);

  return app;
}
