import { listaDeAreasResposta } from '../dto/areaDTO.js';
import * as areaService from '../services/areaService.js';

export async function listar(req, res) {
  const areas = await areaService.listar();
  res.json({ areas: listaDeAreasResposta(areas) });
}
