# Histórias de Usuário - Segunda Iteração

Iteração dedicada ao controle de acesso do Scientia. As três histórias abaixo cobrem
o ciclo completo de uma conta no sistema: entrar no sistema pela primeira vez,
voltar depois e sair com segurança. Todas usam JWT.

Os papéis usados no sistema são dois:

| Papel   | O que pode fazer                                                  |
| ------- | ----------------------------------------------------------------- |
| `USER`  | Acessar o painel e consultar o acervo do curso                     |
| `ADMIN` | Tudo que o `USER` faz, mais as telas de administração do sistema   |

---

## História 1 - Cadastro no sistema

> **Sendo** um visitante do sistema
> **Eu quero** poder me cadastrar no sistema com meu e-mail, senha, nome e papel
> **Para que** eu possa usar as funcionalidades do sistema.

### Critérios de aceitação

1. O formulário de cadastro pede nome, e-mail, senha e papel (`ADMIN` ou `USER`).
2. O sistema recusa o cadastro e explica o motivo quando o nome tem menos de 3
   caracteres, o e-mail está em formato inválido, a senha tem menos de 6
   caracteres ou o papel não é um dos dois previstos.
3. Não é possível cadastrar dois usuários com o mesmo e-mail. A comparação
   ignora maiúsculas e minúsculas.
4. A senha nunca é guardada em texto puro; o que fica salvo é o hash dela.
5. Nenhuma resposta da API devolve o hash da senha junto com os dados do usuário.
6. Ao concluir o cadastro o usuário já entra autenticado, recebendo o token e
   sendo levado direto para o painel.

### Tarefas

- [x] Modelar o usuário com os campos id, nome, e-mail, senha e papel
- [x] Criar o repositório de usuários com busca por e-mail e por id
- [x] Validar os dados de entrada no service e devolver erro 400 com a mensagem
- [x] Aplicar hash na senha com bcrypt antes de salvar
- [x] Impedir e-mail repetido devolvendo erro 409
- [x] Criar o DTO que recorta o usuário para a resposta da API
- [x] Criar o endpoint `POST /api/auth/cadastro`
- [x] Criar a tela de cadastro em React com os quatro campos
- [x] Ligar a tela ao serviço de API e tratar as mensagens de erro
- [x] Estilizar o formulário no CSS

---

## História 2 - Autenticação

> **Sendo** um usuário do sistema
> **Eu quero** poder me autenticar com meu e-mail e minha senha
> **Para que** eu possa acessar as funcionalidades do sistema.

### Critérios de aceitação

1. Informando e-mail e senha corretos, o usuário recebe um token JWT assinado e
   com prazo de validade.
2. O token carrega o identificador, o nome, o e-mail e o papel do usuário.
3. E-mail inexistente e senha errada produzem a mesma mensagem genérica, para não
   revelar quais e-mails estão cadastrados.
4. Toda requisição a uma rota protegida passa pelo filtro de autenticação e é
   recusada com 401 sem um token válido no cabeçalho `Authorization`.
5. Um token expirado ou adulterado é recusado com uma mensagem clara.
6. Rotas restritas ao papel `ADMIN` respondem 403 para quem está autenticado como
   `USER`, mesmo que a pessoa digite o endereço direto no navegador.
7. Recarregando a página, o usuário continua autenticado enquanto o token guardado
   ainda for válido.

### Tarefas

- [x] Criar o service de token com geração e verificação usando JWT
- [x] Criar o endpoint `POST /api/auth/login` conferindo a senha com bcrypt
- [x] Escrever o middleware de autenticação que intercepta todas as requisições
- [x] Concentrar em um arquivo de configuração quais rotas são públicas
- [x] Escrever o middleware de autorização por papel
- [x] Proteger `GET /api/usuarios` deixando só o `ADMIN` entrar
- [x] Criar o endpoint `GET /api/auth/perfil` para o frontend revalidar o token
- [x] Criar o contexto de autenticação no React guardando usuário e token
- [x] Fazer o serviço de API mandar o token no cabeçalho `Authorization`
- [x] Criar o guard de rota, com verificação de sessão e de papel
- [x] Criar a tela de login e a tela de acesso negado
- [x] Estilizar as telas no CSS

---

## História 3 - Logout

> **Sendo** um usuário autenticado no sistema
> **Eu quero** me deslogar do sistema
> **Para que** eu possa sair do sistema com segurança.

### Critérios de aceitação

1. Existe um botão de sair visível em todas as telas internas.
2. Ao sair, o token some do navegador e o usuário é levado para a tela de login.
3. O token usado na sessão encerrada deixa de funcionar na API, mesmo que alguém
   tenha copiado ele antes. Como um JWT continuaria válido até vencer, o backend
   guarda o identificador dos tokens encerrados e recusa quem tentar reusá-los.
4. O logout de um usuário não derruba a sessão dos outros.
5. Se a requisição de logout falhar, a sessão local é encerrada mesmo assim.
6. Depois de sair, tentar voltar para uma tela interna leva de novo para o login.

### Tarefas

- [x] Guardar no backend a lista dos tokens encerrados
- [x] Fazer o filtro de autenticação recusar token que está nessa lista
- [x] Descartar da lista os tokens que já venceram sozinhos
- [x] Criar o endpoint `POST /api/auth/logout`
- [x] Criar a função de sair no contexto de autenticação do React
- [x] Colocar o botão de sair no cabeçalho e redirecionar para o login
- [x] Estilizar o botão no CSS

---

## Onde cada parte ficou no código

### Backend

| Responsabilidade                          | Arquivo                                    |
| ----------------------------------------- | ------------------------------------------ |
| Modelo do usuário                         | `backend/src/models/Usuario.js`            |
| Armazenamento dos usuários                | `backend/src/models/repositorioUsuarios.js`|
| Recorte dos dados na resposta (DTO)       | `backend/src/dto/usuarioDTO.js`            |
| Regras de cadastro e autenticação         | `backend/src/services/usuarioService.js`   |
| Geração, verificação e revogação do token | `backend/src/services/tokenService.js`     |
| Filtro de token em toda requisição        | `backend/src/middlewares/autenticacao.js`  |
| Verificação de papel                      | `backend/src/middlewares/autorizacao.js`   |
| Endpoints abertos e protegidos            | `backend/src/config/seguranca.js`          |
| Controllers                               | `backend/src/controllers/`                 |
| Rotas                                     | `backend/src/routes/`                      |

### Frontend

| Responsabilidade                     | Arquivo                                        |
| ------------------------------------ | ---------------------------------------------- |
| Chamadas à API com o token           | `frontend/src/servicos/api.js`                 |
| Serviços de autenticação e usuários  | `frontend/src/servicos/`                       |
| Estado da sessão                     | `frontend/src/contexto/AuthContext.jsx`        |
| Guard das rotas                      | `frontend/src/componentes/RotaProtegida.jsx`   |
| Telas                                | `frontend/src/paginas/`                        |
| Estilos                              | `frontend/src/estilos/`                        |

---

## Observação sobre o papel escolhido no cadastro

A primeira história pede que o visitante informe o papel no momento do cadastro, e
foi assim que implementamos. Vale registrar que, em um sistema em produção, deixar
qualquer pessoa se cadastrar como `ADMIN` não seria aceitável: o normal é todo
cadastro público virar `USER` e a promoção para `ADMIN` ser feita por quem já é
administrador. Fica anotado como ponto a rever em uma próxima iteração.

---

# Histórias de Usuário - Terceira Iteração

Iteração dedicada ao acervo, o propósito central do Scientia: registrar as produções
científicas do curso e permitir que a comunidade as consulte. O cadastro de produções
entrou na iteração anterior a esta história; a consulta abaixo completa o ciclo.

## História 4 - Consulta de produções

> **Sendo** um usuário autenticado no sistema
> **Eu quero** consultar as produções científicas cadastradas, podendo filtrá-las
> **Para que** eu possa explorar o acervo do curso e encontrar trabalhos do meu interesse.

### Critérios de aceitação

1. Qualquer usuário autenticado (`USER` ou `ADMIN`) acessa a tela de consulta; sem
   sessão, o guard leva para o login.
2. A listagem mostra, para cada produção: título, tipo de trabalho, ano, autores,
   resumo, palavras-chave e o link de acesso.
3. É possível filtrar por texto (casando com título, autores ou palavras-chave, sem
   diferenciar maiúsculas), por tipo de trabalho e por ano — isolados ou combinados.
4. Os filtros são aplicados no backend, via query string do `GET /api/producoes`.
5. Um tipo de trabalho ou ano inválido na query é recusado com erro 400 e mensagem
   explicando o problema.
6. As produções vêm ordenadas da mais recente para a mais antiga (ano de publicação;
   dentro do mesmo ano, o cadastro mais novo primeiro).
7. Acervo vazio e filtro sem resultados mostram mensagens distintas; no acervo vazio
   há um convite para cadastrar a primeira produção.

### Tarefas

- [x] Criar o service de consulta com os filtros e a ordenação
- [x] Criar o controller de consulta lendo os filtros da query string
- [x] Expor o `GET /api/producoes` nas rotas de produção
- [x] Montar as rotas de produção no `app.js` (ligando também o `POST` do cadastro)
- [x] Criar o serviço de consulta no React montando a query string
- [x] Criar a tela do acervo com busca, filtros e os cards das produções
- [x] Registrar as rotas `/producoes` e `/producoes/cadastro` no roteamento
- [x] Adicionar o link "Produções" no cabeçalho
- [x] Estilizar a barra de filtros e os cards no CSS (e importar o `producoes.css`)
