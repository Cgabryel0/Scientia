import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CadastroProjeto } from '../paginas/CadastroProjeto.jsx';
import * as areaService from '../servicos/areaService.js';
import * as grupoService from '../servicos/grupoService.js';
import * as projetoService from '../servicos/projetoService.js';
import {
  CORPO_NOVO_PROJETO,
  RESPOSTA_AREAS,
  RESPOSTA_GRUPOS,
  RESPOSTA_PROJETO,
} from './fixturesAcervo.js';

vi.mock('../servicos/projetoService.js', () => ({
  cadastrar: vi.fn(),
}));

vi.mock('../servicos/grupoService.js', () => ({
  listar: vi.fn(),
}));

vi.mock('../servicos/areaService.js', () => ({
  listar: vi.fn(),
}));

const sessaoFalsa = { usuario: null, token: 'token-do-pesquisador' };

vi.mock('../contexto/AuthContext.jsx', () => ({
  useAuth: () => sessaoFalsa,
}));

const [computacao, agronomia] = RESPOSTA_AREAS.areas;

function renderizarTela() {
  return render(
    <MemoryRouter initialEntries={['/projetos/cadastro']}>
      <Routes>
        <Route path="/projetos/cadastro" element={<CadastroProjeto />} />
        <Route path="/projetos/:id" element={<p>Detalhe do projeto</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function preencherFormulario() {
  fireEvent.change(screen.getByLabelText(/^título$/i), {
    target: { value: CORPO_NOVO_PROJETO.titulo },
  });
  fireEvent.change(screen.getByLabelText(/resumo/i), {
    target: { value: CORPO_NOVO_PROJETO.resumo },
  });
  fireEvent.change(screen.getByLabelText(/data de início/i), {
    target: { value: CORPO_NOVO_PROJETO.dataInicio },
  });
  fireEvent.change(screen.getByLabelText(/situação/i), {
    target: { value: CORPO_NOVO_PROJETO.status },
  });
  fireEvent.change(screen.getByLabelText(/grupo de pesquisa/i), {
    target: { value: String(CORPO_NOVO_PROJETO.idGrupo) },
  });
  fireEvent.click(screen.getByLabelText(computacao.nome));
  fireEvent.click(screen.getByLabelText(agronomia.nome));
}

function enviarFormulario() {
  fireEvent.click(screen.getByRole('button', { name: /cadastrar projeto/i }));
}

describe('Tela de cadastro de projeto', () => {
  beforeEach(() => {
    grupoService.listar.mockResolvedValue(RESPOSTA_GRUPOS);
    areaService.listar.mockResolvedValue(RESPOSTA_AREAS);
    projetoService.cadastrar.mockResolvedValue(RESPOSTA_PROJETO);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('envia o corpo do contrato do backend e leva ao detalhe do projeto criado', async () => {
    renderizarTela();
    await act(async () => {});

    preencherFormulario();
    enviarFormulario();
    await act(async () => {});

    expect(projetoService.cadastrar).toHaveBeenCalledWith(
      CORPO_NOVO_PROJETO,
      'token-do-pesquisador',
    );
    expect(screen.getByText('Detalhe do projeto')).toBeInTheDocument();
  });

  it('projeto sem data de fim vai com dataFim nulo', async () => {
    renderizarTela();
    await act(async () => {});

    preencherFormulario();
    fireEvent.click(screen.getByLabelText(agronomia.nome));
    enviarFormulario();
    await act(async () => {});

    expect(projetoService.cadastrar).toHaveBeenCalledWith(
      { ...CORPO_NOVO_PROJETO, dataFim: null, areas: [computacao.id] },
      'token-do-pesquisador',
    );
  });

  it('não oferece escolha de edital, que o backend ainda não expõe para consulta', async () => {
    renderizarTela();
    await act(async () => {});

    expect(screen.queryByLabelText(/edital/i)).not.toBeInTheDocument();
  });

  it('data de fim anterior à de início não vira requisição', async () => {
    renderizarTela();
    await act(async () => {});

    preencherFormulario();
    fireEvent.change(screen.getByLabelText(/data de fim/i), { target: { value: '2024-02-29' } });
    enviarFormulario();
    await act(async () => {});

    expect(projetoService.cadastrar).not.toHaveBeenCalled();
    expect(screen.getByText(/data de fim não pode ser anterior/i)).toBeInTheDocument();
  });

  it('sem grupo escolhido, a validação do cliente segura o envio', async () => {
    renderizarTela();
    await act(async () => {});

    preencherFormulario();
    fireEvent.change(screen.getByLabelText(/grupo de pesquisa/i), { target: { value: '' } });
    enviarFormulario();
    await act(async () => {});

    expect(projetoService.cadastrar).not.toHaveBeenCalled();
    expect(screen.getByText(/informe um grupo válido/i)).toBeInTheDocument();
  });

  it('mostra a mensagem de erro devolvida pelo backend', async () => {
    projetoService.cadastrar.mockRejectedValue(new Error('Grupo não encontrado.'));

    renderizarTela();
    await act(async () => {});

    preencherFormulario();
    enviarFormulario();
    await act(async () => {});

    expect(screen.getByText('Grupo não encontrado.')).toBeInTheDocument();
  });
});
