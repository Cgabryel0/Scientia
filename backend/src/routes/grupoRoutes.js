import { Router } from 'express';

import * as grupoController from '../controllers/grupoController.js';
import { exigeTipo } from '../middlewares/autorizacao.js';

const rotas = Router();

rotas.get('/', grupoController.listar);
rotas.post('/', exigeTipo('pesquisador', 'admin'), grupoController.cadastrar);
rotas.get('/:id', grupoController.detalhar);
rotas.put('/:id', exigeTipo('pesquisador', 'admin'), grupoController.atualizar);
rotas.delete('/:id', exigeTipo('pesquisador', 'admin'), grupoController.excluir);

export default rotas;
