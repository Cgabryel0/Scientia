import { Router } from 'express';

import * as pesquisadorConsultaController from '../controllers/pesquisadorConsultaController.js';

const rotas = Router();

rotas.get('/', pesquisadorConsultaController.listar);

export default rotas;
