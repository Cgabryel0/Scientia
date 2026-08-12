import { Router } from 'express';

import * as authController from '../controllers/authController.js';

const rotas = Router();

rotas.post('/cadastro', authController.cadastrar);
rotas.post('/login', authController.login);
rotas.post('/logout', authController.logout);
rotas.get('/perfil', authController.perfil);

export default rotas;
