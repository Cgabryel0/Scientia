import { criarApp } from './app.js';
import { PORTA } from './config/ambiente.js';
import { garantirAdminInicial } from './services/usuarioService.js';

await garantirAdminInicial();

criarApp().listen(PORTA, () => {
  console.log(`API do Scientia rodando em http://localhost:${PORTA}`);
});
