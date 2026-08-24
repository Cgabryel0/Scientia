import { transacao } from '../config/bd.js';
import { ErroHttp } from '../erros/ErroHttp.js';
import * as repositorioCandidaturas from '../models/repositorioCandidaturas.js';
import * as repositorioVagas from '../models/repositorioVagas.js';
import {
  validarEnumOpcional,
  validarId,
  validarInteiroOpcional,
  validarPaginacao,
} from './consultaParametrosService.js';

const STATUS_CANDIDATURA = ['pendente', 'aprovada', 'rejeitada'];

export async function listar(filtros, usuario) {
  const paginacao = validarPaginacao(filtros);
  const status = validarEnumOpcional(
    filtros.status,
    STATUS_CANDIDATURA,
    'O status deve ser pendente, aprovada ou rejeitada.',
  );
  let idAluno = validarInteiroOpcional(filtros.idAluno, 'O id do aluno deve ser um número inteiro.', {
    minimo: 1,
  });
  const idVaga = validarInteiroOpcional(filtros.idVaga, 'O id da vaga deve ser um número inteiro.', {
    minimo: 1,
  });

  if (usuario.tipo === 'aluno') {
    idAluno = await resolverIdAluno(usuario);
  }

  const resultado = await repositorioCandidaturas.listar({
    idAluno,
    idVaga,
    status,
    limite: paginacao.limite,
    deslocamento: paginacao.deslocamento,
  });

  return {
    candidaturas: resultado.itens,
    paginacao: {
      pagina: paginacao.pagina,
      porPagina: paginacao.porPagina,
      total: resultado.total,
    },
  };
}

export async function buscarPorId(valorIdAluno, valorIdVaga, usuario) {
  const idAluno = validarId(valorIdAluno);
  const idVaga = validarId(valorIdVaga);
  await garantirAcessoAoAluno(idAluno, usuario);
  const candidatura = await repositorioCandidaturas.buscarPorId(idAluno, idVaga);

  if (!candidatura) {
    throw new ErroHttp(404, 'Candidatura não encontrada.');
  }

  return candidatura;
}

export async function cadastrar(dados, usuario) {
  const idVaga = validarId(dados?.idVaga);
  const idAluno = await resolverAlunoParaCadastro(dados, usuario);
  const dataCandidatura = normalizarData(dados?.dataCandidatura) ?? dataHoje();

  try {
    await transacao(async (cliente) => {
      if (!(await repositorioCandidaturas.alunoExiste(idAluno, cliente))) {
        throw new ErroHttp(400, 'Aluno não encontrado.');
      }

      if (!(await repositorioVagas.existe(idVaga, cliente))) {
        throw new ErroHttp(400, 'Vaga não encontrada.');
      }

      const vaga = await repositorioVagas.buscarPorId(idVaga, cliente);
      if (vaga.status !== 'aberta') {
        throw new ErroHttp(409, 'A vaga está fechada para novas candidaturas.');
      }

      await repositorioCandidaturas.criar(cliente, {
        idAluno,
        idVaga,
        status: 'pendente',
        dataCandidatura,
      });
    });

    return repositorioCandidaturas.buscarPorId(idAluno, idVaga);
  } catch (err) {
    tratarConflito(err);
    throw err;
  }
}

export async function atualizar(valorIdAluno, valorIdVaga, dados) {
  const idAluno = validarId(valorIdAluno);
  const idVaga = validarId(valorIdVaga);
  const status = String(dados?.status ?? '').trim();

  if (!STATUS_CANDIDATURA.includes(status)) {
    throw new ErroHttp(400, 'O status deve ser pendente, aprovada ou rejeitada.');
  }

  await transacao(async (cliente) => {
    const candidatura = await repositorioCandidaturas.buscarPorId(idAluno, idVaga, cliente);
    if (!candidatura) {
      throw new ErroHttp(404, 'Candidatura não encontrada.');
    }

    await repositorioCandidaturas.atualizarStatus(cliente, idAluno, idVaga, status);
  });

  return repositorioCandidaturas.buscarPorId(idAluno, idVaga);
}

export async function excluir(valorIdAluno, valorIdVaga, usuario) {
  const idAluno = validarId(valorIdAluno);
  const idVaga = validarId(valorIdVaga);
  await garantirAcessoAoAluno(idAluno, usuario);

  await transacao(async (cliente) => {
    const candidatura = await repositorioCandidaturas.buscarPorId(idAluno, idVaga, cliente);
    if (!candidatura) {
      throw new ErroHttp(404, 'Candidatura não encontrada.');
    }

    await repositorioCandidaturas.excluir(cliente, idAluno, idVaga);
  });
}

async function resolverAlunoParaCadastro(dados, usuario) {
  if (usuario.tipo === 'aluno') {
    return resolverIdAluno(usuario);
  }

  if (usuario.tipo === 'admin') {
    return validarId(dados?.idAluno);
  }

  throw new ErroHttp(403, 'Seu perfil não tem permissão para cadastrar candidaturas.');
}

async function garantirAcessoAoAluno(idAluno, usuario) {
  if (usuario.tipo !== 'aluno') {
    return;
  }

  const idDoUsuario = await resolverIdAluno(usuario);
  if (idDoUsuario !== idAluno) {
    throw new ErroHttp(403, 'Você só pode acessar suas próprias candidaturas.');
  }
}

async function resolverIdAluno(usuario) {
  const idAluno = await repositorioCandidaturas.buscarAlunoPorConta(Number(usuario.sub));

  if (!idAluno) {
    throw new ErroHttp(403, 'Sua conta não está vinculada a um aluno.');
  }

  return idAluno;
}

function normalizarData(valor) {
  if (valor == null || valor === '') {
    return null;
  }

  if (typeof valor !== 'string' || !dataValida(valor)) {
    throw new ErroHttp(400, 'Informe a data da candidatura no formato YYYY-MM-DD.');
  }

  return valor;
}

function dataHoje() {
  return new Date().toISOString().slice(0, 10);
}

function dataValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const data = new Date(`${valor}T00:00:00.000Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

function tratarConflito(erro) {
  if (erro.code === '23505' && erro.constraint === 'pk_candidatura') {
    throw new ErroHttp(409, 'Você já possui candidatura para essa vaga.');
  }

  if (erro.code === '23503' && erro.constraint === 'fk_candidatura_aluno') {
    throw new ErroHttp(400, 'Aluno não encontrado.');
  }

  if (erro.code === '23503' && erro.constraint === 'fk_candidatura_vaga') {
    throw new ErroHttp(400, 'Vaga não encontrada.');
  }
}
