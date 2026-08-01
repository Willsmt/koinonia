import { http, HttpResponse } from 'msw'

const API = 'http://localhost:8000/api'

const VALID_USERNAME = 'wills'
const VALID_PASSWORD = 'senha-forte-123'

export const handlers = [
  http.post(`${API}/accounts/login/`, async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string }
    if (body.username === VALID_USERNAME && body.password === VALID_PASSWORD) {
      return HttpResponse.json({ token: 'fake-token-123' })
    }
    return HttpResponse.json(
      { non_field_errors: ['Não foi possível fazer login com as credenciais informadas.'] },
      { status: 400 },
    )
  }),

  http.post(`${API}/accounts/register/`, () => {
    return HttpResponse.json({ id: 1, username: VALID_USERNAME }, { status: 201 })
  }),

  http.get(`${API}/accounts/me/`, () => {
    return HttpResponse.json({
      id: 3,
      username: VALID_USERNAME,
      email: 'wills@example.com',
      nome: 'Willians Martins',
      apelido: 'wills',
      nome_exibicao: 'wills',
      telefone: null,
      foto: null,
      bio: '',
      date_joined: '2026-07-30T00:00:00Z',
    })
  }),

  http.get(`${API}/church/memberships/`, () => {
    return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
  }),

  http.get(`${API}/church/celulas/`, () => {
    return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
  }),

  http.get(`${API}/church/redes/`, () => {
    return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
  }),

  http.get(`${API}/interactions/follows/`, () => {
    return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
  }),

  http.get(`${API}/posts/feed_global/`, () => {
    return HttpResponse.json({
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          author: 3,
          author_nome: 'wills',
          escopo: 'global',
          celula: null,
          rede: null,
          posted_as: null,
          conteudo: 'Deus seja louvado',
          created_at: '2026-07-31T20:33:59Z',
        },
      ],
    })
  }),

  http.get(`${API}/interactions/likes/`, () => {
    return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
  }),

  http.get(`${API}/interactions/comments/`, () => {
    return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
  }),

  http.get(`${API}/interactions/notifications/`, () => {
    return HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
  }),

  http.post(`${API}/posts/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      {
        id: 99,
        author: 3,
        author_nome: 'wills',
        conteudo: body.conteudo,
        escopo: body.escopo,
        celula: body.celula ?? null,
        rede: body.rede ?? null,
        posted_as: null,
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    )
  }),
]
