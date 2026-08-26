import { Router } from 'express';

import * as pesquisadorConsultaController from '../controllers/pesquisadorConsultaController.js';

const rotas = Router();

rotas.get('/', pesquisadorConsultaController.listar);
rotas.get('/:id', pesquisadorConsultaController.detalhar);

export default rotas;
