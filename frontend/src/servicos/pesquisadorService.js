<<<<<<< HEAD
import { montarConsulta, requisitar } from './api.js';

export function listar(filtros) {
  return requisitar(`/pesquisadores${montarConsulta(filtros)}`);
}
=======
import { montarConsulta, requisitar } from './api.js';

export function listar(filtros) {
  return requisitar(`/pesquisadores${montarConsulta(filtros)}`);
}

export function obterPorId(id) {
  return requisitar(`/pesquisadores/${id}`);
}
>>>>>>> a207049 (feat(frontend): adiciona páginas de publicações, pesquisadores e rotas principais)
