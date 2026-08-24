import { Router } from 'express';

import * as projetoController from '../controllers/projetoController.js';
import { exigeTipo } from '../middlewares/autorizacao.js';

const rotas = Router();

rotas.get('/', projetoController.listar);
rotas.post('/', exigeTipo('pesquisador', 'admin'), projetoController.cadastrar);
rotas.get('/:id', projetoController.detalhar);
rotas.put('/:id', exigeTipo('pesquisador', 'admin'), projetoController.atualizar);
rotas.delete('/:id', exigeTipo('pesquisador', 'admin'), projetoController.excluir);

export default rotas;
