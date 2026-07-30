# koinonia

Rede social para igrejas organizadas em células. Feed global estilo microblog
combinado com espaços por rede e por célula, com visibilidade e permissões
derivadas do papel de cada membro na estrutura da igreja.

## Arquitetura

Monolito modular (Django + DRF) com front-end desacoplado (React), organizado
em bounded contexts:

- `accounts` — usuário, autenticação, perfil
- `church` — redes, células, membership (papel + escopo)
- `posts` — postagens, escopos (célula / rede / global), feeds
- `interactions` — comentários, curtidas, follow

O controle de acesso do sistema deriva de uma única fonte: o `Membership`
(papel + escopo). Não há tipos de usuário distintos nem permissão espalhada.

## Stack

- Back-end: Python 3.14, Django 6, Django REST Framework, PostgreSQL
- Front-end: React (a definir bundler no ciclo do front)
- Deploy: PythonAnywhere (API) + Vercel (front), CD via webhook do GitHub

## Setup (back-end)

Requisitos: Python 3.14, Poetry, PostgreSQL.

```bash
cd backend
cp .env.example .env   # ajuste os valores
poetry install
poetry run python manage.py migrate
poetry run python manage.py runserver
```

## Estrutura do repositório

koinonia/
├── backend/ # API Django + DRF
└── frontend/ # SPA React

## API — Accounts

Base: `/api/accounts/`

| Método | Rota         | Auth    | Descrição                                   |
| ------ | ------------ | ------- | ------------------------------------------- |
| POST   | `/register/` | pública | Cadastro. Retorna `token` + dados do user   |
| POST   | `/login/`    | pública | Login por `username` + `password` → `token` |
| GET    | `/me/`       | token   | Perfil do usuário autenticado               |
| PATCH  | `/me/`       | token   | Atualiza perfil (nome, apelido, bio, etc.)  |

Auth por token DRF: header `Authorization: Token <token>`.
Exibição de nome: `nome_exibicao` usa o `apelido`; se vazio, cai no `nome`.

### Church (redes, células e membership)

Base: `/api/church/` — todas as rotas exigem autenticação (Token).

| Rota                       | Métodos                       | Quem escreve                           |
| -------------------------- | ----------------------------- | -------------------------------------- |
| `/api/church/redes/`       | GET, POST, PUT, PATCH, DELETE | Pastor                                 |
| `/api/church/celulas/`     | GET, POST, PUT, PATCH, DELETE | Pastor, líder de rede                  |
| `/api/church/memberships/` | GET, POST, PUT, PATCH, DELETE | Líder de célula, líder de rede, pastor |

Leitura (GET) liberada para qualquer usuário autenticado.

**Modelo de papéis.** Todo controle de acesso deriva de uma única fonte, o
`Membership` (relação 1-para-1 com o usuário). O papel define o escopo:

| Papel            | Âncora         | O que enxerga                |
| ---------------- | -------------- | ---------------------------- |
| `member`         | uma célula     | a própria célula             |
| `cell_leader`    | uma célula     | todas as células da sua rede |
| `network_leader` | uma rede       | todas as redes               |
| `pastor`         | igreja inteira | tudo                         |

A invariante papel↔escopo é garantida em duas camadas: validação no serializer
(erro 400 legível) e `CheckConstraint` no banco (rede de segurança).

**Bootstrap.** O superuser Django cria as redes/células pelo `/admin/` e promove
o primeiro pastor criando um `Membership` com `role=pastor`.

### Posts (postagens, escopos e feed)

Base: `/api/posts/` — todas as rotas exigem autenticação (Token).

| Rota               | Métodos     | Observação         |
| ------------------ | ----------- | ------------------ |
| `/api/posts/`      | GET, POST   | Ver escopo abaixo  |
| `/api/posts/{id}/` | GET, DELETE | DELETE só do autor |

Edição (PUT/PATCH) desabilitada — posts não são editáveis. Exclusão restrita ao
autor do post.

**Escopo do post.** Todo post pertence a **um** escopo, com o alvo garantido por
`CheckConstraint` (célula→célula, rede→rede, global→sem alvo). O escopo define
quem lê e quem escreve:

| Escopo   | Quem lê                                         | Quem escreve                   |
| -------- | ----------------------------------------------- | ------------------------------ |
| `celula` | membros da célula + líderes acima na hierarquia | membro/líder da própria célula |
| `rede`   | quem pertence à rede + líderes acima            | líder da rede, pastor          |
| `global` | qualquer autenticado (igreja inteira)           | qualquer autenticado           |

A leitura segue o scoping de hierarquia do `Membership` (ver **Modelo de papéis**
acima): quanto mais alto o papel, mais largo enxerga. Post fora do escopo do
usuário retorna **404** — não 403; o objeto nem aparece no queryset.

**Feeds nomeados.** Além do `GET /api/posts/` (lista escopada por hierarquia),
há três feeds como sub-rotas:

| Rota                      | Timeline por  | Conteúdo                                   |
| ------------------------- | ------------- | ------------------------------------------ |
| `/api/posts/feed_global/` | _follow_      | posts globais de quem você segue + os seus |
| `/api/posts/feed_celula/` | pertencimento | posts da célula que você ancora            |
| `/api/posts/feed_rede/`   | pertencimento | posts da rede que você ancora              |

`feed_global` é curadoria (por `Follow`); `feed_celula`/`feed_rede` são por âncora
do `Membership` (a célula/rede que você _possui_), não pela visibilidade ampla da
leitura — um líder de célula lê a rede toda, mas seu feed de célula é só o dele.

**Autoria.** `author` é sempre o usuário real, carimbado no servidor. Líder de
célula pode assinar um post da própria célula via `posted_as` (a voz institucional
da célula), sem perder o registro de quem escreveu.

### Interactions (comentários, curtidas e follow)

Base: `/api/interactions/` — todas as rotas exigem autenticação (Token).

| Rota                          | Métodos           | Observação                                    |
| ----------------------------- | ----------------- | --------------------------------------------- |
| `/api/interactions/comments/` | GET, POST, DELETE | `?post={id}` filtra por post; DELETE só autor |
| `/api/interactions/likes/`    | GET, POST, DELETE | `?post={id}` filtra; DELETE só de quem curtiu |
| `/api/interactions/follows/`  | GET, POST, DELETE | Ver listas abaixo; DELETE só do follower      |

Comentar e curtir exigem **leitura** no post-alvo: o campo `post` só aceita posts
visíveis ao usuário (mesmo scoping de hierarquia dos posts). Post fora do escopo é
recusado como pk inválida — não revela que existe. Curtida é única por (post,
usuário); comentário não tem edição.

**Follow e listas.** `GET /api/interactions/follows/` lista quem **você segue**;
`?rel=followers` lista quem **segue você**. Não é possível seguir a si mesmo
(`CheckConstraint` + validação) nem seguir duas vezes (par único).
