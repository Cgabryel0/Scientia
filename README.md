# Scientia - Hub de Produção Científica do BCC/UFAPE

## Integrantes
[Lucas Feitoza](https://github.com/hazdriel) | [Carlos Gabyrel Espianhara](https://github.com/cgabryel0) | [Laura Vitória Mendes](https://github.com/l4uramendes)

## Sobre o Projeto
Projeto para implementação de um hub de produção científica do curso de __Bacharelado em Ciência da Computação (BCC)__ da UFAPE, desenvolvido para a disciplina de __Engenharia de Software__ ministrada pela Professora [Thaís Burity](https://github.com/taburity), referente ao período de 2026.1.

O Scientia tem como propósito centralizar, organizar e dar visibilidade à produção científica da comunidade acadêmica do BCC, reunindo artigos, projetos de pesquisa, trabalhos de conclusão de curso e demais publicações de docentes e discentes do curso.

## Objetivos
O sistema deve permitir o cadastro e a consulta das produções científicas do curso, vinculando cada produção aos seus autores. Com isso, alunos, professores e visitantes poderão explorar o acervo científico do BCC de maneira rápida e prática, acompanhando o que é produzido no curso e facilitando a divulgação e o acesso aos trabalhos acadêmicos.

## Tecnologias Usadas
### [React](https://react.dev/) + [Vite](https://vite.dev/)
* Frontend em JavaScript, com React Router para a navegação
### [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
* Backend em JavaScript expondo a API REST
### [JWT](https://jwt.io/) + [bcrypt](https://www.npmjs.com/package/bcryptjs)
* Autenticação por token e senhas guardadas como hash

## Status do Projeto
Em desenvolvimento - segunda iteração (controle de acesso) concluída.

## Segunda iteração: controle de acesso
Esta iteração implementou cadastro, login e logout com JWT, além da autorização
pelos papéis `ADMIN` e `USER`. As histórias de usuário, os critérios de aceitação
e a quebra em tarefas estão em [docs/historias-de-usuario.md](docs/historias-de-usuario.md).

Como funciona, em resumo:

* No cadastro e no login o backend devolve um **token JWT** assinado e com validade.
* O frontend guarda esse token e o envia no cabeçalho `Authorization` de toda
  requisição a rota protegida.
* Um **middleware de autenticação** intercepta todas as requisições da API. Só as
  rotas listadas como públicas em `backend/src/config/seguranca.js` passam sem token.
* Um **middleware de autorização** trava as rotas que exigem um papel específico.
* No logout o token entra numa lista de encerrados e passa a ser recusado, então
  não adianta reaproveitar um token copiado antes de sair.
* No frontend, o componente `RotaProtegida` funciona como **guard**: sem sessão
  manda para o login, e sem o papel exigido manda para a tela de acesso negado.

### Endpoints da API

| Método | Rota                  | Acesso            |
| ------ | --------------------- | ----------------- |
| GET    | `/api/status`         | Público           |
| POST   | `/api/auth/cadastro`  | Público           |
| POST   | `/api/auth/login`     | Público           |
| POST   | `/api/auth/logout`    | Autenticado       |
| GET    | `/api/auth/perfil`    | Autenticado       |
| GET    | `/api/usuarios`       | Somente `ADMIN`   |

## Executando o projeto
Precisa do [Node.js](https://nodejs.org/) 20 ou superior.

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
Disponível em `http://localhost:3000`.

Quando o servidor sobe, ele cria a conta de administrador definida no `.env`
(por padrão `admin@scientia.ufape.br` / `admin123`), que serve para testar as
rotas restritas ao papel `ADMIN`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Disponível em `http://localhost:5173`.

> Os usuários ficam guardados em memória enquanto o backend está no ar, então
> eles somem quando o servidor é reiniciado. A troca por um banco de dados está
> prevista para a próxima iteração e mexe apenas em
> `backend/src/models/repositorioUsuarios.js`.
