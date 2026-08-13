import cors from 'cors';
import express from 'express';

import { ORIGEM_FRONTEND } from './config/ambiente.js';
import { autenticacao } from './middlewares/autenticacao.js';
import { rotaNaoEncontrada, tratadorDeErros } from './middlewares/erros.js';
import authRoutes from './routes/authRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import producaoRoutes from "./routes/producaoRoutes.js";

export function criarApp() {
  const app = express();

  app.use(cors({ origin: ORIGEM_FRONTEND }));
  app.use(express.json());

  // O filtro de token vem antes das rotas justamente para que nenhuma delas
  // possa ser alcançada sem passar por ele.
  app.use(autenticacao);

  app.get('/api/status', (req, res) => res.json({ status: 'no ar' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/usuarios', usuarioRoutes);
app.use("/api/producoes", producaoRoutes);

  app.use(rotaNaoEncontrada);
  app.use(tratadorDeErros);

  return app;
}
