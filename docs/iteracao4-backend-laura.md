# Quarta iteração — bloco de implantação do backend (Laura)

Este documento é autossuficiente: dá para executar sem acompanhar nenhuma conversa anterior.

**O que é seu:** empacotar o backend em Docker, criar o banco PostgreSQL dedicado no Render e implantar a API lá, com ambiente de produção configurado.
**O que não é seu:** o workflow e a cobertura do backend, mais o SonarCloud, são do Lucas; todo o frontend é do Carlos.

## Como trabalhar

Tudo no seu fork, com PR para a `main` do repositório principal (`ScientiaUFAPE/Scientia`) — é a estrutura que a professora avalia.

```bash
git clone https://github.com/l4uramendes/Scientia.git
cd Scientia
git remote add upstream https://github.com/ScientiaUFAPE/Scientia.git
git fetch upstream && git checkout -b iteracao4/deploy-backend upstream/main
```

Código sem comentários, identificadores em português, seguindo o estilo do que já existe.

## Contexto que você precisa

O backend é Node com Express, em `backend/`, e fala com o PostgreSQL pelo pool em `backend/src/config/bd.js`. A configuração vem toda de variáveis de ambiente, listadas em `backend/.env.example`:

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | endereço completo do banco |
| `BANCO_SSL` | `true` liga TLS — **obrigatório no Render** |
| `PORTA` | porta em que a API escuta |
| `ORIGEM_FRONTEND` | endereço do frontend autorizado no CORS |
| `JWT_SECRET` | segredo que assina os tokens |
| `JWT_EXPIRACAO` | validade do token (ex.: `2h`) |
| `ADMIN_NOME` / `ADMIN_EMAIL` / `ADMIN_SENHA` | conta de administrador criada quando a API sobe |

O esquema e o povoamento do banco estão em `database/init/01-schema.sql` e `02-seed.sql`. Localmente o `docker compose up -d` aplica os dois sozinho; no Render você vai aplicá-los à mão, uma vez.

Comandos existentes: `npm start` (sobe a API), `npm test` (testes, exigem banco).

## Tarefa 1 — Dockerfile do backend

Crie `backend/Dockerfile`:

- Base `node:22-alpine`.
- Instalar só dependências de produção (`npm ci --omit=dev`) — o `package-lock.json` precisa ser copiado antes do código para o cache de camadas funcionar.
- Copiar `src/` e iniciar com `node src/server.js`.
- **A porta precisa vir do ambiente**: o Render injeta `PORT`. O código lê `PORTA` (veja `backend/src/config/ambiente.js`), então garanta que as duas se encontrem — o caminho mais limpo é a variável `PORTA` receber o valor de `PORT` na configuração do serviço no Render.
- Rodar como usuário não-root é boa prática e o SonarCloud gosta.

Teste local antes de subir, apontando para o banco do compose:

```bash
docker compose up -d
docker build -t scientia-backend backend/
docker run --rm -p 3000:3000 \
  -e DATABASE_URL=postgres://scientia:scientia@host.docker.internal:5432/scientia \
  -e PORTA=3000 -e JWT_SECRET=teste scientia-backend
curl http://localhost:3000/api/status
```

## Tarefa 2 — Banco PostgreSQL no Render

Crie um **PostgreSQL** no [Render](https://render.com), plano gratuito, versão 16.

Duas coisas importantes sobre o plano gratuito: **ele expira em 30 dias** e some com os dados, então crie perto da entrega, não semanas antes; e ele oferece duas URLs de conexão — a *interna*, que só funciona entre serviços do Render (é a que a API deve usar, é mais rápida e não sai para a internet), e a *externa*, que você usa da sua máquina.

Aplique o esquema e o povoamento uma vez, da sua máquina, com a URL externa:

```bash
psql "<URL_EXTERNA>" -f database/init/01-schema.sql
psql "<URL_EXTERNA>" -f database/init/02-seed.sql
psql "<URL_EXTERNA>" -c "\dt"
```

Devem aparecer 15 tabelas. Confira também `SELECT count(*) FROM publicacao;` — o esperado é 200.

## Tarefa 3 — Implantar a API

Crie um **Web Service** apontando para o repositório principal, runtime Docker, root directory `backend`, branch `main`, plano gratuito.

Variáveis de ambiente do serviço:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | a URL **interna** do banco |
| `BANCO_SSL` | `true` |
| `PORTA` | a porta que o Render expõe (`PORT`) |
| `JWT_SECRET` | um valor longo e aleatório — **nunca** o de exemplo |
| `JWT_EXPIRACAO` | `2h` |
| `ORIGEM_FRONTEND` | a URL do frontend do Carlos |
| `ADMIN_NOME`, `ADMIN_EMAIL`, `ADMIN_SENHA` | a conta de administrador de produção, com senha própria |

Um cuidado: `JWT_SECRET` e `ADMIN_SENHA` são segredos de verdade. Não os coloque em nenhum arquivo do repositório — só na configuração do Render.

**Coordene com o Carlos**: você precisa da URL do frontend dele para o CORS, e ele precisa da sua para o build. Nenhum dos dois existe antes do primeiro deploy, então implantem os dois e depois acertem as duas variáveis.

Quando subir, verifique de fora:

```bash
curl https://<sua-url>.onrender.com/api/status
curl https://<sua-url>.onrender.com/api/publicacoes?porPagina=2
```

O primeiro acesso depois de um tempo ocioso demora cerca de um minuto — o plano gratuito hiberna, não está quebrado.

## Tarefa 4 — README

Acrescente a URL do backend na seção que o Lucas vai criar no `README.md` (a professora exige as URLs lá). Combine com ele para não conflitarem no mesmo trecho.

## Como saber que terminou

- [ ] `docker build` e `docker run` do backend funcionando localmente, com `/api/status` respondendo
- [ ] Banco no Render com as 15 tabelas e o povoamento aplicado
- [ ] API no ar, respondendo `/api/status` e `/api/publicacoes` de fora
- [ ] Login funcionando em produção (teste com a conta de administrador)
- [ ] Frontend do Carlos conversando com a sua API, sem erro de CORS
- [ ] URL no README
- [ ] Tarefas correspondentes criadas e movidas no Quadro Scrum

## Se travar

- Erro de conexão com o banco: quase sempre é `BANCO_SSL` faltando (`true`) ou o uso da URL externa no lugar da interna.
- A API sobe e cai logo depois: veja os logs no Render; costuma ser porta errada (o serviço precisa escutar na porta que o Render injeta) ou `DATABASE_URL` inválida.
- Frontend recebe erro de CORS: `ORIGEM_FRONTEND` precisa ser exatamente a URL do frontend, com `https://` e sem barra no fim.
