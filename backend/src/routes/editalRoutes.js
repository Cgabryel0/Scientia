import { Router } from 'express';

import * as editalController from '../controllers/editalController.js';

const rotas = Router();

rotas.get('/', editalController.listar);

export default rotas;
