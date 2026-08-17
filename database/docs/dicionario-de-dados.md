# Scientia - Dicionário de Dados

Banco `scientia`, PostgreSQL 16. As tabelas estão na ordem em que são criadas no
`database/init/01-schema.sql`.

## curso
Cursos da UFAPE, de graduação e pós. Serve para saber se um aluno pode se
candidatar a uma vaga.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_curso` | SERIAL | PK | Identificador do curso |
| `nome_curso` | VARCHAR(150) | NOT NULL, UNIQUE | Nome oficial do curso |

## conta
Login e senha. Fica separada de `aluno` e `pesquisador` porque a mesma pessoa pode
ter os dois papéis, e porque pesquisador importado não tem conta.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_conta` | SERIAL | PK | Identificador da conta |
| `email` | VARCHAR(150) | NOT NULL, UNIQUE | E-mail usado como login |
| `senha_hash` | VARCHAR(255) | NOT NULL | Hash da senha; a senha em texto puro não é guardada |
| `tipo` | VARCHAR(20) | NOT NULL, CHECK | `pesquisador`, `aluno` ou `admin` |
| `data_criacao` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Quando a conta foi criada |

## aluno
Discente que se candidata a vagas. Todo aluno tem conta, porque candidatar-se
exige login.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_aluno` | SERIAL | PK | Identificador do aluno |
| `id_conta` | INT | NOT NULL, UNIQUE, FK para `conta` | Conta de acesso; o UNIQUE impede dois alunos no mesmo login |
| `id_curso` | INT | NOT NULL, FK para `curso` | Curso em que está matriculado |
| `nome` | VARCHAR(150) | NOT NULL | Nome completo |
| `matricula` | VARCHAR(30) | NOT NULL, UNIQUE | Matrícula institucional |

## pesquisador
Quem aparece na vitrine. Pode ter vindo do Lattes ou do DGP sem ter conta, por
isso `id_conta` aceita nulo.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_pesquisador` | SERIAL | PK | Identificador do pesquisador |
| `id_conta` | INT | NULL, UNIQUE, FK para `conta` | Conta de acesso; nulo em quem foi importado e ainda não assumiu o perfil |
| `nome` | VARCHAR(150) | NOT NULL | Nome completo |
| `numero_lattes` | VARCHAR(50) | NOT NULL, UNIQUE | Número de 16 dígitos do currículo Lattes |
| `email` | VARCHAR(150) | NOT NULL | E-mail de contato mostrado na vitrine |
| `vinculo` | VARCHAR(100) | NOT NULL, CHECK | `docente`, `discente` ou `externo` |
| `origem` | VARCHAR(100) | NOT NULL, CHECK | De onde veio o registro: `lattes`, `dgp` ou `manual` |

## agencia_fomento
Quem financia. Virou tabela para o nome do órgão não ficar repetido em todo edital.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_agencia` | SERIAL | PK | Identificador da agência |
| `nome` | VARCHAR(150) | NOT NULL, UNIQUE | Nome ou sigla |

## edital
Chamada de financiamento. O sistema só referencia, não controla orçamento.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_edital` | SERIAL | PK | Identificador do edital |
| `id_agencia` | INT | NOT NULL, FK para `agencia_fomento` | Agência que lançou |
| `nome_edital` | VARCHAR(150) | NOT NULL | Nome e número da chamada |
| `ano` | INT | NOT NULL, CHECK entre 1990 e 2100 | Ano de publicação |

## grupo_pesquisa
Grupo do Diretório de Grupos de Pesquisa do CNPq.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_grupo` | SERIAL | PK | Identificador do grupo |
| `nome_grupo` | VARCHAR(150) | NOT NULL, UNIQUE | Nome do grupo |
| `link_dgp` | VARCHAR(255) | NULL | Link do espelho no Diretório |
| `ano_criacao` | INT | NOT NULL, CHECK entre 1950 e 2100 | Ano de fundação |

## projeto_pesquisa
Centro do modelo. É do projeto que saem as vagas e as publicações.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_projeto` | SERIAL | PK | Identificador do projeto |
| `id_grupo` | INT | NOT NULL, FK para `grupo_pesquisa` | Grupo que abriga o projeto |
| `id_edital` | INT | NULL, FK para `edital` | Chamada que financia; nulo quando não tem fomento |
| `titulo` | VARCHAR(255) | NOT NULL | Título do projeto |
| `resumo` | TEXT | NULL | Descrição do objeto e da metodologia |
| `data_inicio` | DATE | NOT NULL | Data de início |
| `data_fim` | DATE | NULL, CHECK maior ou igual a `data_inicio` | Data de encerramento; nula enquanto não acabou |
| `status` | VARCHAR(30) | NOT NULL, CHECK | `planejado`, `em_andamento`, `concluido` ou `cancelado` |
| `origem` | VARCHAR(100) | NOT NULL, CHECK | De onde veio o registro: `lattes`, `dgp` ou `manual` |

## area_conhecimento
Áreas da tabela do CNPq.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_area` | SERIAL | PK | Identificador da área |
| `nome_area` | VARCHAR(150) | NOT NULL, UNIQUE | Nome da área ou subárea |

## publicacao
O que sai de um projeto.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_publicacao` | SERIAL | PK | Identificador da publicação |
| `id_projeto` | INT | NOT NULL, FK para `projeto_pesquisa` | Projeto que originou |
| `tipo` | VARCHAR(50) | NOT NULL, CHECK | `artigo`, `capitulo` ou `resumo` |
| `ano` | INT | NOT NULL, CHECK entre 1950 e 2100 | Ano de publicação |
| `doi` | VARCHAR(100) | NULL, UNIQUE | DOI; nulo para trabalho que não tem |
| `veiculo` | VARCHAR(150) | NOT NULL | Revista ou evento onde saiu |
| `titulo` | VARCHAR(255) | NOT NULL | Título do trabalho |

## vaga
Vaga aberta por um projeto. No conceitual é entidade fraca, porque não existe fora
do projeto e duas vagas de projetos diferentes podem ter o mesmo título. No físico
demos um `id_vaga` próprio, para a chave estrangeira em `candidatura` não virar
composta.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_vaga` | SERIAL | PK | Identificador da vaga |
| `id_projeto` | INT | NOT NULL, FK para `projeto_pesquisa` | Projeto dono; apagar o projeto apaga as vagas |
| `titulo` | VARCHAR(150) | NOT NULL | Nome da vaga, tipo `Bolsista PIBIC` |
| `requisitos` | TEXT | NULL | O que se exige do candidato |
| `status` | VARCHAR(30) | NOT NULL, CHECK | `aberta` aceita candidatura, `fechada` não |
| `qtd_vagas` | INT | NOT NULL, DEFAULT 1, CHECK maior que zero | Quantas posições |
| `data_abertura` | DATE | NOT NULL | Quando foi publicada |

## membro
Resolve o N:N entre pesquisador e grupo.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_pesquisador` | INT | PK, FK para `pesquisador` | Pesquisador filiado |
| `id_grupo` | INT | PK, FK para `grupo_pesquisa` | Grupo |
| `papel_grupo` | VARCHAR(100) | NOT NULL, CHECK | `lider` ou `membro` |

## participacao
Resolve o N:N entre pesquisador e projeto. É o único lugar que diz quem coordena.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_pesquisador` | INT | PK, FK para `pesquisador` | Pesquisador da equipe |
| `id_projeto` | INT | PK, FK para `projeto_pesquisa` | Projeto |
| `data_entrada` | DATE | NOT NULL | Quando entrou na equipe |
| `papel` | VARCHAR(100) | NOT NULL, CHECK | `coordenador` ou `participante` |

## possui_area
Resolve o N:N entre projeto e área. Um projeto pode cruzar mais de uma.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_projeto` | INT | PK, FK para `projeto_pesquisa` | Projeto classificado |
| `id_area` | INT | PK, FK para `area_conhecimento` | Área atribuída |

## autoria
Resolve o N:N entre pesquisador e publicação. Liga direto ao autor e não à equipe
do projeto, senão todo mundo do projeto viraria autor de tudo.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_pesquisador` | INT | PK, FK para `pesquisador` | Autor |
| `id_publicacao` | INT | PK, FK para `publicacao` | Trabalho assinado |
| `ordem` | INT | NOT NULL, CHECK maior que zero, UNIQUE com `id_publicacao` | Posição na assinatura, começando em 1; o UNIQUE impede dois autores na mesma posição |

## candidatura
Resolve o N:N entre aluno e vaga.

| Atributo | Tipo | Restrições | Semântica |
|---|---|---|---|
| `id_aluno` | INT | PK, FK para `aluno` | Aluno candidato |
| `id_vaga` | INT | PK, FK para `vaga` | Vaga pretendida |
| `status` | VARCHAR(30) | NOT NULL, CHECK | `pendente`, `aprovada` ou `rejeitada` |
| `data_candidatura` | DATE | NOT NULL | Quando se inscreveu |
