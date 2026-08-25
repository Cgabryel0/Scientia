import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CadastroPublicacao } from '../paginas/CadastroPublicacao.jsx';
import * as pesquisadorService from '../servicos/pesquisadorService.js';
import * as projetoService from '../servicos/projetoService.js';
import * as publicacaoService from '../servicos/publicacaoService.js';

vi.mock('../servicos/areaService.js', () => ({
  listar: vi.fn().mockResolvedValue({ areas: [] })
}));
import {
  CORPO_NOVA_PUBLICACAO,
  RESPOSTA_PESQUISADORES,
  RESPOSTA_PROJETOS,
  RESPOSTA_PUBLICACAO_CRIADA,
} from './fixturesAcervo.js';

vi.mock('../servicos/publicacaoService.js', () => ({
  cadastrar: vi.fn(),
}));

vi.mock('../servicos/projetoService.js', () => ({
  listar: vi.fn(),
}));

vi.mock('../servicos/pesquisadorService.js', () => ({
  listar: vi.fn(),
}));

const sessaoFalsa = { usuario: null, token: 'token-do-pesquisador' };

vi.mock('../contexto/AuthContext.jsx', () => ({
  useAuth: () => sessaoFalsa,
}));

const [autorExistente, autorNovo] = CORPO_NOVA_PUBLICACAO.autores;
const [projetoDaSpec] = RESPOSTA_PROJETOS.projetos;

function renderizarTela() {
  return render(
    <MemoryRouter initialEntries={['/publicacoes/cadastro']}>
      <Routes>
        <Route path="/publicacoes/cadastro" element={<CadastroPublicacao />} />
        <Route path="/publicacoes" element={<p>Lista de publicações</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function passarODebounce() {
  await act(async () => {
    vi.advanceTimersByTime(400);
  });
}

async function preencherFormulario() {
  fireEvent.change(screen.getByLabelText(/^título$/i), {
    target: { value: CORPO_NOVA_PUBLICACAO.titulo },
  });
  fireEvent.change(screen.getByLabelText(/^tipo$/i), {
    target: { value: CORPO_NOVA_PUBLICACAO.tipo },
  });
  fireEvent.change(screen.getByLabelText(/^ano$/i), {
    target: { value: String(CORPO_NOVA_PUBLICACAO.ano) },
  });
  fireEvent.change(screen.getByLabelText(/veículo/i), {
    target: { value: CORPO_NOVA_PUBLICACAO.veiculo },
  });
  fireEvent.change(screen.getByLabelText(/doi/i), {
    target: { value: CORPO_NOVA_PUBLICACAO.doi },
  });

  fireEvent.click(screen.getByRole('button', { name: new RegExp(projetoDaSpec.titulo, 'i') }));
  await act(async () => {});

  fireEvent.change(screen.getByLabelText(/buscar pesquisador/i), { target: { value: 'a' } });
  await passarODebounce();

  fireEvent.click(screen.getByRole('button', { name: /^Ana Souza Docente/ }));
  await act(async () => {});

  fireEvent.click(screen.getByRole('button', { name: /cadastrar um autor que ainda não está/i }));
  fireEvent.change(screen.getByLabelText(/nome do autor/i), { target: { value: autorNovo.nome } });
  fireEvent.change(screen.getByLabelText(/número lattes/i), {
    target: { value: autorNovo.numeroLattes },
  });
  fireEvent.change(screen.getByLabelText(/vínculo/i), { target: { value: autorNovo.vinculo } });
  fireEvent.click(screen.getByRole('button', { name: /adicionar autor novo/i }));
  await act(async () => {});
}

function enviarFormulario() {
  fireEvent.click(screen.getByRole('button', { name: /cadastrar publicação/i }));
}

describe('Tela de cadastro de publicação', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    projetoService.listar.mockResolvedValue(RESPOSTA_PROJETOS);
    pesquisadorService.listar.mockResolvedValue(RESPOSTA_PESQUISADORES);
    publicacaoService.cadastrar.mockResolvedValue(RESPOSTA_PUBLICACAO_CRIADA);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('envia o corpo exato do contrato do backend, com o token da sessão', async () => {
    renderizarTela();
    await act(async () => {});

    await preencherFormulario();
    enviarFormulario();
    await act(async () => {});

    expect(publicacaoService.cadastrar).toHaveBeenCalledWith(
      CORPO_NOVA_PUBLICACAO,
      'token-do-pesquisador',
    );
    expect(screen.getByText('Lista de publicações')).toBeInTheDocument();
  });

  it('a ordem dos autores na tela é a ordem enviada ao backend', async () => {
    renderizarTela();
    await act(async () => {});

    await preencherFormulario();
    fireEvent.click(screen.getByRole('button', { name: `Subir ${autorNovo.nome}` }));
    await act(async () => {});

    enviarFormulario();
    await act(async () => {});

    expect(publicacaoService.cadastrar).toHaveBeenCalledWith(
      { ...CORPO_NOVA_PUBLICACAO, autores: [autorNovo, autorExistente] },
      'token-do-pesquisador',
    );
  });

  it('busca projetos com o termo digitado depois do debounce', async () => {
    renderizarTela();
    await act(async () => {});

    fireEvent.change(screen.getByLabelText(/^projeto$/i), { target: { value: 'agreste' } });
    await passarODebounce();

    expect(projetoService.listar).toHaveBeenLastCalledWith({ busca: 'agreste', porPagina: 15 });
  });

  it('sem projeto e sem autor, a validação do cliente segura o envio', async () => {
    renderizarTela();
    await act(async () => {});

    enviarFormulario();
    await act(async () => {});

    expect(publicacaoService.cadastrar).not.toHaveBeenCalled();
    expect(screen.getByText(/informe o título/i)).toBeInTheDocument();
    expect(screen.getByText(/informe um projeto válido/i)).toBeInTheDocument();
    expect(screen.getByText(/informe ao menos um autor/i)).toBeInTheDocument();
  });

  it('ano fora da faixa do banco não chega a virar requisição', async () => {
    renderizarTela();
    await act(async () => {});

    await preencherFormulario();
    fireEvent.change(screen.getByLabelText(/^ano$/i), { target: { value: '1899' } });

    enviarFormulario();
    await act(async () => {});

    expect(publicacaoService.cadastrar).not.toHaveBeenCalled();
    expect(screen.getByText(/entre 1950 e 2100/i)).toBeInTheDocument();
  });

  it('mostra a mensagem de erro devolvida pelo backend', async () => {
    publicacaoService.cadastrar.mockRejectedValue(
      new Error('Já existe uma publicação com esse DOI.'),
    );

    renderizarTela();
    await act(async () => {});

    await preencherFormulario();
    enviarFormulario();
    await act(async () => {});

    expect(screen.getByText('Já existe uma publicação com esse DOI.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cadastrar publicação/i })).toBeEnabled();
  });
});
