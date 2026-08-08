import { Router } from 'express';

import * as usuarioController from '../controllers/usuarioController.js';
import { exigeRole } from '../middlewares/autorizacao.js';

const rotas = Router();

// Listar todo mundo é tarefa de administração, então USER não entra aqui.
rotas.get('/', exigeRole('ADMIN'), usuarioController.listar);

export default rotas;
