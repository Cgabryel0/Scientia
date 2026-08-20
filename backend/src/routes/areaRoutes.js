import { Router } from 'express';

import * as areaController from '../controllers/areaController.js';

const rotas = Router();

rotas.get('/', areaController.listar);

export default rotas;
