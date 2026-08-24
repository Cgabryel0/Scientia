import { Router } from 'express';

import * as relatorioController from '../controllers/relatorioController.js';

const rotas = Router();

rotas.get('/projetos', relatorioController.projetos);
rotas.get('/publicacoes', relatorioController.publicacoes);
rotas.get('/grupos', relatorioController.grupos);

export default rotas;
