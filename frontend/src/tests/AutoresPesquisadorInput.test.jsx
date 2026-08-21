import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AutoresPesquisadorInput } from '../componentes/AutoresPesquisadorInput.jsx';
import * as pesquisadorService from '../servicos/pesquisadorService.js';
import { CORPO_NOVA_PUBLICACAO, RESPOSTA_PESQUISADORES } from './fixturesAcervo.js';

vi.mock('../servicos/pesquisadorService.js', () => ({
  listar: vi.fn(),
}));

const [autorExistente, autorNovo] = CORPO_NOVA_PUBLICACAO.autores;

const aoAlterar = vi.fn();

function renderizarEditor() {
  return render(<AutoresPesquisadorInput aoAlterar={aoAlterar} />);
}

async function buscar(termo) {
  fireEvent.change(screen.getByLabelText(/buscar pesquisador/i), { target: { value: termo } });

  await act(async () => {
    vi.advanceTimersByTime(400);
  });
}

async function preencherAutorNovo({ nome, numeroLattes, vinculo, email }) {
  fireEvent.click(screen.getByRole('button', { name: /cadastrar um autor que ainda não está/i }));

  fireEvent.change(screen.getByLabelText(/nome do autor/i), { target: { value: nome } });
  fireEvent.change(screen.getByLabelText(/número lattes/i), { target: { value: numeroLattes } });
  fireEvent.change(screen.getByLabelText(/vínculo/i), { target: { value: vinculo } });

  if (email !== undefined) {
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: email } });
  }

  fireEvent.click(screen.getByRole('button', { name: /adicionar autor novo/i }));
  await act(async () => {});
}

function itensDaLista() {
  return screen.getAllByRole('listitem').filter((item) => item.querySelector('.editor-autores__posicao'));
}

describe('Editor de autores', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pesquisadorService.listar.mockResolvedValue(RESPOSTA_PESQUISADORES);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('só busca pesquisadores depois do debounce e com um termo escrito', async () => {
    renderizarEditor();
    await act(async () => {});

    expect(pesquisadorService.listar).not.toHaveBeenCalled();

    await buscar('souza');

    expect(pesquisadorService.listar).toHaveBeenCalledWith({ busca: 'souza', porPagina: 10 });
  });

  it('escolher um pesquisador da busca entrega o autor no formato do backend', async () => {
    renderizarEditor();
    await buscar('souza');

    fireEvent.click(screen.getByRole('button', { name: /ana souza/i }));
    await act(async () => {});

    expect(aoAlterar).toHaveBeenLastCalledWith([autorExistente]);
    expect(within(itensDaLista()[0]).getByText('1')).toBeInTheDocument();
  });

  it('cadastrar um autor novo entrega nome, Lattes, vínculo e e-mail vazio', async () => {
    renderizarEditor();
    await act(async () => {});

    await preencherAutorNovo(autorNovo);

    expect(aoAlterar).toHaveBeenLastCalledWith([autorNovo]);
  });

  it('monta a lista mista da spec, com o existente em primeiro e o novo em segundo', async () => {
    renderizarEditor();
    await buscar('a');

    fireEvent.click(screen.getByRole('button', { name: /ana souza/i }));
    await act(async () => {});

    await preencherAutorNovo(autorNovo);

    expect(aoAlterar).toHaveBeenLastCalledWith(CORPO_NOVA_PUBLICACAO.autores);

    const itens = itensDaLista();
    expect(within(itens[0]).getByText('Ana Souza')).toBeInTheDocument();
    expect(within(itens[1]).getByText('Bruno Lima')).toBeInTheDocument();
  });

  it('subir o segundo autor inverte a ordem enviada', async () => {
    renderizarEditor();
    await buscar('a');

    fireEvent.click(screen.getByRole('button', { name: /ana souza/i }));
    await act(async () => {});
    await preencherAutorNovo(autorNovo);

    fireEvent.click(screen.getByRole('button', { name: 'Subir Bruno Lima' }));
    await act(async () => {});

    expect(aoAlterar).toHaveBeenLastCalledWith([autorNovo, autorExistente]);

    const itens = itensDaLista();
    expect(within(itens[0]).getByText('Bruno Lima')).toBeInTheDocument();
    expect(within(itens[1]).getByText('Ana Souza')).toBeInTheDocument();
  });

  it('o primeiro autor não sobe e o último não desce', async () => {
    renderizarEditor();
    await buscar('a');

    fireEvent.click(screen.getByRole('button', { name: /ana souza/i }));
    await act(async () => {});

    expect(screen.getByRole('button', { name: 'Subir Ana Souza' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Descer Ana Souza' })).toBeDisabled();
  });

  it('remover tira o autor da lista e renumera as posições', async () => {
    renderizarEditor();
    await buscar('a');

    fireEvent.click(screen.getByRole('button', { name: /ana souza/i }));
    await act(async () => {});
    await preencherAutorNovo(autorNovo);

    fireEvent.click(screen.getByRole('button', { name: 'Remover Ana Souza' }));
    await act(async () => {});

    expect(aoAlterar).toHaveBeenLastCalledWith([autorNovo]);

    const [primeiro] = itensDaLista();
    expect(within(primeiro).getByText('1')).toBeInTheDocument();
    expect(within(primeiro).getByText('Bruno Lima')).toBeInTheDocument();
  });

  it('um pesquisador já escolhido não pode ser escolhido de novo pela busca', async () => {
    renderizarEditor();
    await buscar('a');

    fireEvent.click(screen.getByRole('button', { name: /ana souza/i }));
    await act(async () => {});

    expect(screen.getByRole('button', { name: /^Ana Souza Docente/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Bruno Lima Discente/ })).toBeEnabled();
  });

  it('autor novo com Lattes de alguém já na lista é recusado antes de ir ao backend', async () => {
    renderizarEditor();
    await buscar('a');

    fireEvent.click(screen.getByRole('button', { name: /bruno lima/i }));
    await act(async () => {});

    aoAlterar.mockClear();
    await preencherAutorNovo({ ...autorNovo, nome: 'Bruno L.' });

    expect(screen.getByText('Esse autor já está na lista.')).toBeInTheDocument();
    expect(aoAlterar).not.toHaveBeenCalled();
    expect(itensDaLista()).toHaveLength(1);
  });

  it('autor novo sem nome ou sem Lattes não entra na lista', async () => {
    renderizarEditor();
    await act(async () => {});

    await preencherAutorNovo({ ...autorNovo, numeroLattes: '' });

    expect(screen.getByText('Informe o nome e o número Lattes do autor novo.')).toBeInTheDocument();
    expect(aoAlterar).not.toHaveBeenCalled();
  });

  it('autor novo com e-mail malformado é recusado antes de ir ao backend', async () => {
    renderizarEditor();
    await act(async () => {});

    await preencherAutorNovo({ ...autorNovo, email: 'bruno-arroba-errado' });

    expect(
      screen.getByText('Informe um email válido para o autor novo.'),
    ).toBeInTheDocument();
    expect(aoAlterar).not.toHaveBeenCalled();
    expect(screen.getByText('Nenhum autor escolhido até agora.')).toBeInTheDocument();
  });

  it('autor novo com e-mail longo demais é recusado antes de ir ao backend', async () => {
    renderizarEditor();
    await act(async () => {});

    await preencherAutorNovo({
      ...autorNovo,
      email: `${'a'.repeat(140)}@ufape.edu.br`,
    });

    expect(
      screen.getByText('O email do autor deve ter no máximo 150 caracteres.'),
    ).toBeInTheDocument();
    expect(aoAlterar).not.toHaveBeenCalled();
  });

  it('autor novo com e-mail válido entra na lista com o e-mail informado', async () => {
    renderizarEditor();
    await act(async () => {});

    await preencherAutorNovo({ ...autorNovo, email: 'bruno.lima@ufape.edu.br' });

    expect(aoAlterar).toHaveBeenLastCalledWith([
      { ...autorNovo, email: 'bruno.lima@ufape.edu.br' },
    ]);
  });

  it('sem resultados, sugere cadastrar o autor à mão', async () => {
    pesquisadorService.listar.mockResolvedValue({
      ...RESPOSTA_PESQUISADORES,
      pesquisadores: [],
      paginacao: { ...RESPOSTA_PESQUISADORES.paginacao, total: 0 },
    });

    renderizarEditor();
    await buscar('ninguem');

    expect(screen.getByText(/nenhum pesquisador encontrado/i)).toBeInTheDocument();
  });
});
