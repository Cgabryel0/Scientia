import { Router } from 'express';

import * as usuarioController from '../controllers/usuarioController.js';
import { exigeTipo } from '../middlewares/autorizacao.js';

const rotas = Router();

rotas.get('/', exigeTipo('admin'), usuarioController.listar);

export default rotas;
