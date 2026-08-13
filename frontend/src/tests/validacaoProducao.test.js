import { describe, expect, it } from 'vitest';

import { validarFormulario } from '../utils/validacaoProducao.js';

const formularioValido = {
  titulo: 'Redes Neurais no Agreste',
  tipoTrabalho: 'ARTIGO',
  autores: ['João Silva'],
  resumo: 'Um estudo sobre redes neurais.',
  palavrasChave: ['IA'],
  anoPublicacao: '2025',
  arquivoOuLink: 'https://exemplo.br/artigo.pdf',
};

describe('validarFormulario', () => {
  it('não aponta erro nenhum para um formulário completo', () => {
    expect(validarFormulario(formularioValido)).toEqual({});
  });

  it('exige título', () => {
    const erros = validarFormulario({ ...formularioValido, titulo: '   ' });
    expect(erros.titulo).toMatch(/título/i);
  });

  it('exige um tipo de trabalho da lista', () => {
    const erros = validarFormulario({ ...formularioValido, tipoTrabalho: 'ROMANCE' });
    expect(erros.tipoTrabalho).toMatch(/tipo de trabalho/i);
  });

  it('exige pelo menos um autor e uma palavra-chave', () => {
    const erros = validarFormulario({ ...formularioValido, autores: [], palavrasChave: [] });
    expect(erros.autores).toMatch(/autor/i);
    expect(erros.palavrasChave).toMatch(/palavra-chave/i);
  });

  it('recusa ano fora do intervalo permitido', () => {
    expect(validarFormulario({ ...formularioValido, anoPublicacao: '1900' }).anoPublicacao).toBeDefined();
    expect(validarFormulario({ ...formularioValido, anoPublicacao: '3000' }).anoPublicacao).toBeDefined();
    expect(validarFormulario({ ...formularioValido, anoPublicacao: 'abc' }).anoPublicacao).toBeDefined();
  });

  it('exige o arquivo ou endereço eletrônico', () => {
    const erros = validarFormulario({ ...formularioValido, arquivoOuLink: '' });
    expect(erros.arquivoOuLink).toMatch(/arquivo|endereço/i);
  });
});
