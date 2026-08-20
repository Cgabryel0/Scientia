import { Router } from 'express';

import * as publicacaoController from '../controllers/publicacaoController.js';

const rotas = Router();

rotas.get('/', publicacaoController.listar);
rotas.get('/:id', publicacaoController.detalhar);

export default rotas;
