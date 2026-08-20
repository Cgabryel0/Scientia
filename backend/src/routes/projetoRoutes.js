import { Router } from 'express';

import * as projetoController from '../controllers/projetoController.js';

const rotas = Router();

rotas.get('/', projetoController.listar);
rotas.get('/:id', projetoController.detalhar);

export default rotas;
