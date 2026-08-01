# koinonia

[![CI](https://github.com/Willsmt/koinonia/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Willsmt/koinonia/actions/workflows/ci.yml)
[![CodeFactor](https://www.codefactor.io/repository/github/willsmt/koinonia/badge)](https://www.codefactor.io/repository/github/willsmt/koinonia)

Rede social para igrejas organizadas em células. Feed em três escopos (célula,
rede, global) combinado com curtidas, comentários, follow, busca de pessoas,
gestão de membros e um dashboard de estatísticas — tudo com visibilidade e
permissões derivadas do papel de cada membro na estrutura da igreja.

## Arquitetura

Monolito modular (Django + DRF) com front-end desacoplado (React + Vite),
organizado em bounded contexts:

- `accounts` — usuário, autenticação, perfil, busca/listagem pública de usuários
- `church` — redes, células, membership (papel + escopo), dashboard de estatísticas
- `posts` — postagens (texto e/ou imagem), escopos (célula / rede / global), feeds
- `interactions` — comentários, curtidas, follow, notificações
- `reports` — relatos de bug (texto + imagem + página), gerenciados pelo pastor

O controle de acesso do sistema deriva de uma única fonte: o `Membership`
(papel + escopo). Não há tipos de usuário distintos nem permissão espalhada.

## Stack

- Back-end: Python 3.14, Django 6, Django REST Framework, PostgreSQL
- Front-end: React 19 + TypeScript, Vite, Redux Toolkit, React Router,
  Tailwind CSS, react-hook-form + zod, Recharts
- Testes: back-end via `manage.py test` (Django TestCase); front-end via
  Vitest + React Testing Library + MSW
- Deploy (planejado, ciclo 9): API no Render + Postgres no Neon, front-end na
  Vercel

## Setup (back-end)

Requisitos: Python 3.14, Poetry, PostgreSQL.

```bash
cd backend
cp .env.example .env   # ajuste os valores
poetry install
poetry run python manage.py migrate
poetry run python manage.py runserver
```

## Setup (front-end)

Requisitos: Node 22+.

```bash
cd frontend
cp .env.example .env   # ajuste VITE_API_URL se o back não estiver em localhost:8000
npm install
npm run dev
```

Scripts disponíveis: `npm run dev` (servidor local), `npm run build` (build de
produção), `npm run lint` (ESLint), `npm run test` (Vitest).

## Estrutura do repositório

koinonia/
├── backend/ # API Django + DRF
└── frontend/ # SPA React

## CI

Pipeline no GitHub Actions (`.github/workflows/ci.yml`) roda em todo push/PR
para `main`, com três jobs em paralelo:

- **lint** — `ruff check` + `ruff format --check` (back-end)
- **test** — suíte completa do back-end (`manage.py test`) contra Postgres
  real de serviço (não SQLite)
- **frontend** — ESLint + Vitest + build (TypeScript + Vite)

Actions fixadas por commit SHA (hardening de supply chain). Análise estática
contínua via CodeFactor (badge acima).

## Testes automatizados (front-end)

Vitest + React Testing Library + MSW (mock na camada de rede, não da lib
HTTP — o axios de produção continua em uso). Cobertura:

- Reducers puros dos slices Redux (auth, posts, likes, comments)
- Componentes críticos (LoginPage, RegisterPage, ProtectedRoute) com
  submissão de formulário real e resposta mockada
- 1 teste de integração completo: login → feed renderizando com dado real de
  uma API mockada

```bash
cd frontend
npm run test
```

## API — Accounts

Base: `/api/accounts/`

| Método | Rota           | Auth    | Descrição                                          |
| ------ | -------------- | ------- | --------------------------------------------------- |
| POST   | `/register/`   | pública | Cadastro. Retorna dados do user criado              |
| POST   | `/login/`      | pública | Login por `username` + `password` → `token`         |
| GET    | `/me/`         | token   | Perfil do usuário autenticado                       |
| PATCH  | `/me/`         | token   | Atualiza perfil (nome, apelido, bio, foto, senha…)  |
| GET    | `/users/`      | token   | Lista/busca pública de usuários (`?search=`)        |
| GET    | `/users/{id}/` | token   | Perfil público de um usuário específico             |

Auth por token DRF: header `Authorization: Token <token>`.
Exibição de nome: `nome_exibicao` usa o `apelido`; se vazio, cai no `nome`.
`/users/` e `/users/{id}/` expõem só campos públicos (id, username,
nome_exibicao, foto, bio, date_joined) — nunca email, telefone ou senha.

### Validação de campos (accounts)

- **Telefone**: opcional; validado e normalizado para E.164 (`+55DDDNNNNNNNNN`) via `phonenumbers` (região BR). Formato inválido ou já em uso → `400`.
- **Nome**: obrigatório; não pode ser vazio nem conter só espaços.
- **Apelido**: opcional; espaços nas pontas são removidos automaticamente.
- **Foto**: opcional; limite de 5MB.

Toda validação de formato/domínio vive no backend (serializer). O front-end cuida só da UX (ex.: máscara de digitação no campo telefone) — nunca é a fonte de verdade.

### Church (redes, células, membership e dashboard)

Base: `/api/church/` — todas as rotas exigem autenticação (Token).

| Rota                      | Métodos                        | Quem escreve                                                       |
| -------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| `/api/church/redes/`      | GET, POST, PUT, PATCH, DELETE   | Pastor                                                                  |
| `/api/church/celulas/`    | GET, POST, PUT, PATCH, DELETE   | Pastor, líder de rede                                                   |
| `/api/church/memberships/`| GET, POST, PUT, PATCH, DELETE   | Líder de célula, líder de rede, pastor — cada um no próprio escopo    |
| `/api/church/dashboard/`  | GET                              | Líder de célula, líder de rede, pastor — cada um no próprio escopo    |

Leitura (GET) liberada para qualquer usuário autenticado, exceto
`/dashboard/` (só liderança).

**Modelo de papéis.** Todo controle de acesso deriva de uma única fonte, o
`Membership` (relação 1-para-1 com o usuário). O papel define o escopo de
**leitura**:

| Papel            | Âncora         | O que enxerga                |
| ---------------- | -------------- | ----------------------------- |
| `member`         | uma célula     | a própria célula             |
| `cell_leader`    | uma célula     | todas as células da sua rede |
| `network_leader` | uma rede       | todas as redes               |
| `pastor`         | igreja inteira | tudo                          |

**Quem pode atribuir/gerenciar qual Membership.** Além do papel mínimo pra
escrever, há uma segunda trava: *qual* role um ator pode atribuir e *em qual*
Membership ele pode mexer (criar, editar, deletar):

| Ator              | Pode atribuir            | Escopo               |
| ------------------ | --------------------------- | ----------------------- |
| `cell_leader`      | `member`                    | só a própria célula    |
| `network_leader`   | `member`, `cell_leader`     | só a própria rede       |
| `pastor`           | qualquer papel               | igreja inteira            |

A invariante papel↔escopo é garantida em três camadas: validação de
autorização no serializer (quem pode atribuir o quê), `has_object_permission`
na view (quem pode mexer em qual registro existente) e `CheckConstraint` no
banco (rede de segurança estrutural).

**Dashboard de estatísticas.** `GET /api/church/dashboard/` devolve, escopado
pela hierarquia acima: total de membros, membros por célula, posts por
escopo, posts nos últimos 14 dias e a célula mais ativa.

**Bootstrap.** O superuser Django cria as redes/células pelo `/admin/` e
promove o primeiro pastor criando um `Membership` com `role=pastor`.

### Posts (postagens, escopos e feed)

Base: `/api/posts/` — todas as rotas exigem autenticação (Token).

| Rota               | Métodos     | Observação         |
| ------------------- | ----------- | -------------------- |
| `/api/posts/`      | GET, POST   | Ver escopo abaixo   |
| `/api/posts/{id}/` | GET, DELETE | DELETE só do autor  |

Edição (PUT/PATCH) desabilitada — posts não são editáveis. Exclusão restrita
ao autor do post.

**Conteúdo.** Um post precisa ter texto e/ou imagem — pelo menos um dos dois,
nunca os dois vazios. Texto até 3000 caracteres; imagem até 2MB.

**Escopo do post.** Todo post pertence a **um** escopo, com o alvo garantido
por `CheckConstraint` (célula→célula, rede→rede, global→sem alvo):

| Escopo   | Quem lê                                          | Quem escreve                                              |
| -------- | --------------------------------------------------- | -------------------------------------------------------------- |
| `celula` | membros da célula + líderes acima na hierarquia    | membro/líder da própria célula, ou pastor (qualquer célula)   |
| `rede`   | quem pertence à rede + líderes acima               | líder da própria rede, pastor (qualquer rede)                  |
| `global` | qualquer autenticado (igreja inteira)              | qualquer autenticado                                            |

A leitura segue o scoping de hierarquia do `Membership` (ver **Modelo de
papéis** acima). Post fora do escopo do usuário retorna **404** — não 403; o
objeto nem aparece no queryset.

**Feeds nomeados.** Além do `GET /api/posts/` (lista escopada por
hierarquia), há três feeds como sub-rotas:

| Rota                      | Timeline por  | Conteúdo                                   |
| -------------------------- | -------------- | -------------------------------------------- |
| `/api/posts/feed_global/` | _follow_      | posts globais de quem você segue + os seus |
| `/api/posts/feed_celula/` | pertencimento | posts da célula que você ancora            |
| `/api/posts/feed_rede/`   | pertencimento | posts da rede que você ancora              |

`feed_global` é curadoria (por `Follow`); `feed_celula`/`feed_rede` são por
âncora do `Membership` (a célula/rede que você *possui*), não pela
visibilidade ampla da leitura — um líder de célula lê a rede toda, mas seu
feed de célula é só o dele.

**Autoria.** `author` é sempre o usuário real, carimbado no servidor. Líder
de célula pode assinar um post da própria célula via `posted_as` (a voz
institucional da célula), sem perder o registro de quem escreveu.

### Interactions (comentários, curtidas, follow e notificações)

Base: `/api/interactions/` — todas as rotas exigem autenticação (Token).

| Rota                                                 | Métodos             | Observação                                        |
| ------------------------------------------------------ | --------------------- | ---------------------------------------------------- |
| `/api/interactions/comments/`                         | GET, POST, DELETE   | `?post={id}` filtra por post; DELETE só autor      |
| `/api/interactions/likes/`                            | GET, POST, DELETE   | `?post={id}` filtra; DELETE só de quem curtiu      |
| `/api/interactions/follows/`                          | GET, POST, DELETE   | Ver listas abaixo; DELETE só do follower           |
| `/api/interactions/notifications/`                    | GET, PATCH, DELETE  | Só as próprias; `?lida=true/false` filtra           |
| `/api/interactions/notifications/marcar_tudo_lido/`   | PATCH                | Marca todas as não lidas do usuário como lidas      |

Comentar e curtir exigem **leitura** no post-alvo: o campo `post` só aceita
posts visíveis ao usuário (mesmo scoping de hierarquia dos posts). Post fora
do escopo é recusado como pk inválida — não revela que existe. Curtida é
única por (post, usuário); comentário não tem edição.

**Follow e listas.** `GET /api/interactions/follows/` lista quem **você
segue**; `?rel=followers` lista quem **segue você**. Não é possível seguir a
si mesmo (`CheckConstraint` + validação) nem seguir duas vezes (par único).

**Notificações.** Seguir, curtir ou comentar gera uma notificação automática
pro dono da ação-alvo (quem foi seguido, ou o autor do post) — exceto quando
o próprio autor curte/comenta o próprio post. Cada usuário só vê as próprias.

### Reports (relatos de bug)

Base: `/api/reports/` — todas as rotas exigem autenticação (Token).

| Rota                              | Métodos       | Quem                                          |
| ----------------------------------- | --------------- | ------------------------------------------------ |
| `/api/reports/bug-reports/`       | POST           | Qualquer autenticado (cria um relato)          |
| `/api/reports/bug-reports/`       | GET            | Só pastor (lista todos os relatos)             |
| `/api/reports/bug-reports/{id}/`  | PATCH, DELETE  | Só pastor (marca resolvido/reabre, exclui)     |

Relato tem descrição (obrigatória, até 2000 caracteres), imagem opcional (até
2MB) e a página onde ocorreu (capturada automaticamente pelo front).
