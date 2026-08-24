import { Router } from 'express';

import * as candidaturaController from '../controllers/candidaturaController.js';
import { exigeTipo } from '../middlewares/autorizacao.js';

const rotas = Router();

rotas.get('/', candidaturaController.listar);
rotas.post('/', exigeTipo('aluno', 'admin'), candidaturaController.cadastrar);
rotas.get('/:idAluno/:idVaga', candidaturaController.detalhar);
rotas.put('/:idAluno/:idVaga', exigeTipo('pesquisador', 'admin'), candidaturaController.atualizar);
rotas.delete('/:idAluno/:idVaga', exigeTipo('aluno', 'admin'), candidaturaController.excluir);

export default rotas;
