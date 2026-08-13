import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Producoes } from '../paginas/Producoes.jsx';
import * as producaoConsultaService from '../servicos/producaoConsultaService.js';

// Integração componente ↔ serviço: a tela real renderiza contra um serviço
// dublê, sem backend — o equivalente ao "backend falso" sugerido na disciplina.
vi.mock('../servicos/producaoConsultaService.js', () => ({
  listar: vi.fn(),
}));

vi.mock('../contexto/AuthContext.jsx', () => ({
  useAuth: () => ({ token: 'token-de-teste' }),
}));

const producoesFalsas = [
  {
    id: '1',
    titulo: 'Visão Computacional na Caatinga',
    tipoTrabalho: 'ARTIGO',
    autores: ['Ana Souza'],
    resumo: 'Detecção de espécies vegetais.',
    palavrasChave: ['visão computacional'],
    anoPublicacao: 2025,
    arquivoOuLink: 'https://exemplo.br/a',
  },
  {
    id: '2',
    titulo: 'Compiladores Educacionais',
    tipoTrabalho: 'TCC',
    autores: ['João Silva'],
    resumo: 'Uma linguagem didática.',
    palavrasChave: ['linguagens'],
    anoPublicacao: 2024,
    arquivoOuLink: 'https://exemplo.br/b',
  },
];

function renderizarTela() {
  return render(
    <MemoryRouter>
      <Producoes />
    </MemoryRouter>,
  );
}

describe('Tela do acervo de produções', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('mostra o carregamento e depois um card para cada produção', async () => {
    producaoConsultaService.listar.mockResolvedValue({ producoes: producoesFalsas });

    renderizarTela();
    expect(screen.getByText(/carregando produções/i)).toBeInTheDocument();

    // Espera as promessas do efeito resolverem.
    await act(async () => {});

    expect(screen.getByText('Compiladores Educacionais')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /acessar produção/i })).toHaveLength(2);

    // A etiqueta e o ano dentro do card ("Artigo" também existe como opção do
    // select de filtro, então o teste mira só o conteúdo do card).
    const card = screen.getByText('Visão Computacional na Caatinga').closest('li');
    expect(within(card).getByText('Artigo')).toBeInTheDocument();
    expect(within(card).getByText('2025')).toBeInTheDocument();
  });

  it('mostra o alerta de erro quando o serviço falha', async () => {
    producaoConsultaService.listar.mockRejectedValue(
      new Error('Não foi possível falar com o servidor. Verifique se a API está no ar.'),
    );

    renderizarTela();
    await act(async () => {});

    expect(screen.getByText(/API está no ar/i)).toBeInTheDocument();
  });

  it('com o acervo vazio e sem filtros, convida a cadastrar a primeira produção', async () => {
    producaoConsultaService.listar.mockResolvedValue({ producoes: [] });

    renderizarTela();
    await act(async () => {});

    expect(screen.getByText(/acervo ainda está vazio/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cadastrar a primeira produção/i })).toBeInTheDocument();
  });

  it('digitar na busca chama o serviço com o termo depois do debounce', async () => {
    producaoConsultaService.listar.mockResolvedValue({ producoes: [] });

    renderizarTela();
    await act(async () => {});

    fireEvent.change(screen.getByPlaceholderText(/título, autor ou palavra-chave/i), {
      target: { value: 'caatinga' },
    });

    // Antes dos 400ms do debounce, nenhuma chamada nova com o termo.
    expect(producaoConsultaService.listar).not.toHaveBeenCalledWith(
      expect.objectContaining({ busca: 'caatinga' }),
      'token-de-teste',
    );

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(producaoConsultaService.listar).toHaveBeenLastCalledWith(
      { busca: 'caatinga', tipoTrabalho: '', anoPublicacao: '' },
      'token-de-teste',
    );
  });
});
