import { Router } from 'express';

import * as grupoController from '../controllers/grupoController.js';

const rotas = Router();

rotas.get('/', grupoController.listar);
rotas.get('/:id', grupoController.detalhar);

export default rotas;
