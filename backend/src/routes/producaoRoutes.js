import { Router } from 'express';

import * as producaoCadastroController from '../controllers/producaoCadastroController.js';
import * as producaoConsultaController from '../controllers/producaoConsultaController.js';

const rotas = Router();

// Consultar o acervo é para qualquer autenticado, por isso não há exigeRole aqui.
rotas.get('/', producaoConsultaController.listar);
rotas.post('/', producaoCadastroController.cadastrar);

export default rotas;
