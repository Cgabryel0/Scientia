import { Router } from 'express';

import * as vagaController from '../controllers/vagaController.js';
import { exigeTipo } from '../middlewares/autorizacao.js';

const rotas = Router();

rotas.get('/', vagaController.listar);
rotas.post('/', exigeTipo('pesquisador', 'admin'), vagaController.cadastrar);
rotas.get('/:id', vagaController.detalhar);
rotas.put('/:id', exigeTipo('pesquisador', 'admin'), vagaController.atualizar);
rotas.delete('/:id', exigeTipo('pesquisador', 'admin'), vagaController.excluir);

export default rotas;
