import { Router } from 'express';

import * as relatorioController from '../controllers/relatorioController.js';
import { exigeTipo } from '../middlewares/autorizacao.js';

const rotas = Router();

rotas.get('/projetos', relatorioController.projetos);
rotas.get('/publicacoes', relatorioController.publicacoes);
rotas.get('/grupos', relatorioController.grupos);
rotas.get(
  '/indicadores-producoes',
  exigeTipo('aluno', 'pesquisador', 'admin'),
  relatorioController.indicadoresProducoes,
);

export default rotas;
