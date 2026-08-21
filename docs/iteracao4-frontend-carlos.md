# Quarta iteração — bloco do frontend (Carlos)

Este documento é autossuficiente: dá para executar sem acompanhar nenhuma conversa anterior.

**O que é seu:** integração contínua do frontend no GitHub Actions, empacotamento em Docker e implantação no Render.
**O que não é seu:** o backend (workflow, cobertura e SonarCloud são do Lucas; Dockerfile do backend, banco e implantação do backend são da Laura).

## Como trabalhar

Tudo no seu fork, com PR para a `main` do repositório principal (`ScientiaUFAPE/Scientia`) — é a estrutura que a professora avalia.

```bash
git clone https://github.com/Cgabryel0/Scientia.git
cd Scientia
git remote add upstream https://github.com/ScientiaUFAPE/Scientia.git
git fetch upstream && git checkout -b iteracao4/frontend upstream/main
```

Código sem comentários, identificadores em português, seguindo o estilo do que já existe no repositório.

## Contexto que você precisa

O frontend é React com Vite, em `frontend/`. Ele conversa com a API pelo endereço em `VITE_API_URL` (veja `frontend/src/servicos/api.js`), que o Vite **embute no bundle em tempo de build** — não é lido em tempo de execução. Isso tem uma consequência prática: a URL da API precisa estar disponível como argumento de build do Docker, não como variável do contêiner.

Comandos que já existem: `npm run build` (gera `dist/`), `npm test` (Vitest), `npm run dev` (porta 5173).

## Tarefa 1 — Integração contínua

Crie `.github/workflows/frontend.yml` na raiz do repositório.

- Dispara em `push` e `pull_request` na branch `main`.
- Roda só quando o frontend muda: filtro de caminho em `frontend/**` e no próprio arquivo do workflow.
- Ubuntu, Node 22, com cache de dependências do npm.
- Passos: `npm ci` → `npm run build` → `npm test`, todos com `working-directory: frontend`.
- O job precisa **falhar** se o build ou os testes falharem (é o que a professora verifica).

Confirme que funciona abrindo o PR e vendo o check verde. Se quiser testar antes, quebre um teste de propósito num commit temporário e veja o workflow ficar vermelho.

## Tarefa 2 — Dockerfile

Crie `frontend/Dockerfile` em dois estágios:

1. **Build**: imagem `node:22-alpine`, `npm ci`, `npm run build`. A URL da API entra como `ARG VITE_API_URL` e vira `ENV` antes do build, para o Vite embutir.
2. **Servir**: `nginx:alpine` servindo o `dist/`.

Dois detalhes que quebram se esquecidos:

- **SPA precisa de fallback**: o React Router usa rotas como `/projetos/12`; sem configuração, o nginx devolve 404 ao recarregar a página. A configuração precisa de `try_files $uri $uri/ /index.html;`.
- **A porta do Render é dinâmica**: o Render injeta `PORT` e espera que o processo escute nela. O nginx não lê variável de ambiente sozinho — use um template (`/etc/nginx/templates/default.conf.template` na imagem oficial já é processado com `envsubst`) ou um pequeno entrypoint que substitua a porta antes de subir.

Teste local antes de subir:

```bash
docker build -t scientia-frontend --build-arg VITE_API_URL=http://localhost:3000/api frontend/
docker run --rm -e PORT=8080 -p 8080:8080 scientia-frontend
```

Abra `http://localhost:8080`, navegue até uma página de detalhe e **recarregue** — se der 404, o fallback de SPA não está certo.

## Tarefa 3 — Implantação no Render

No [Render](https://render.com), crie um **Web Service** apontando para o repositório principal, com runtime Docker.

- Root directory: `frontend`
- Branch: `main`
- Plano gratuito
- Build arg `VITE_API_URL` = a URL pública do backend, com `/api` no fim (ex.: `https://scientia-api.onrender.com/api`)

**Coordene com a Laura**: a URL do backend só existe depois que ela implanta. Enquanto não existir, você pode implantar com um valor provisório e refazer o deploy depois com o valor certo — mas lembre que, como o Vite embute a URL no build, mudar essa variável **exige novo deploy**, não basta reiniciar.

Ela também precisa da SUA URL: o backend só aceita requisições do endereço configurado em `ORIGEM_FRONTEND` (é o CORS). Passe sua URL para ela assim que o serviço subir.

Duas características do plano gratuito que valem saber para não achar que está quebrado: o serviço hiberna quando fica ocioso e a primeira visita depois disso pode levar cerca de um minuto; e o build no Render é mais lento que o local.

## Tarefa 4 — README

Acrescente a URL do frontend implantado na seção que o Lucas vai criar no `README.md` (a professora exige as URLs no README). Combine com ele para não conflitarem no mesmo trecho.

## Como saber que terminou

- [ ] Workflow do frontend verde em push e em PR na `main`
- [ ] `docker build` e `docker run` funcionando localmente, com recarga de página em rota interna sem 404
- [ ] Frontend no ar no Render, abrindo e navegando
- [ ] Frontend conversando com o backend da Laura (login funciona, acervo carrega)
- [ ] URL no README
- [ ] Tarefas correspondentes criadas e movidas no Quadro Scrum

## Se travar

- Workflow não dispara: confira o filtro de caminhos e se o arquivo está em `.github/workflows/` na raiz, não dentro de `frontend/`.
- Tela branca no Render: quase sempre é `VITE_API_URL` errada ou ausente no build — abra o console do navegador e veja para onde as requisições estão indo.
- Erro de CORS: é do lado do backend, fale com a Laura sobre `ORIGEM_FRONTEND`.
