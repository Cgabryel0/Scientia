import { Router } from 'express';

import * as producaoCadastroController from '../controllers/producaoCadastroController.js';

const rotas = Router();

rotas.post('/', producaoCadastroController.cadastrar);

export default rotas;
