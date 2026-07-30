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
