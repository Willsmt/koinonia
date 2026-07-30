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

## API — Accounts (ciclo 1)

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
