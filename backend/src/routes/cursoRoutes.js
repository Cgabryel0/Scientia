import { Router } from 'express';

import * as cursoController from '../controllers/cursoController.js';

const rotas = Router();

rotas.get('/', cursoController.listar);

export default rotas;
