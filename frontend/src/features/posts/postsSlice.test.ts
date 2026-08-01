import { describe, it, expect } from 'vitest'
import reducer, { fetchFeed, createPost, type Post } from './postsSlice'

const post: Post = {
  id: 1,
  author: 3,
  author_nome: 'wills',
  escopo: 'global',
  celula: null,
  rede: null,
  posted_as: null,
  conteudo: 'oi',
  imagem: null,
  created_at: '2026-07-31T20:33:59Z',
}

describe('postsSlice', () => {
  it('fetchFeed.fulfilled substitui a lista quando não é "carregar mais"', () => {
    const initial = reducer(undefined, { type: '@@INIT' })
    const state = reducer(
      initial,
      fetchFeed.fulfilled({ feed: 'global', data: { next: null, previous: null, results: [post] } }, 'reqId', {
        feed: 'global',
      }),
    )
    expect(state.feeds.global.items).toEqual([post])
  })

  it('fetchFeed.fulfilled concatena quando tem url (carregar mais)', () => {
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(
      state,
      fetchFeed.fulfilled({ feed: 'global', data: { next: 'pg2', previous: null, results: [post] } }, 'r1', {
        feed: 'global',
      }),
    )
    const post2 = { ...post, id: 2 }
    state = reducer(
      state,
      fetchFeed.fulfilled({ feed: 'global', data: { next: null, previous: null, results: [post2] } }, 'r2', {
        feed: 'global',
        url: 'pg2',
      }),
    )
    expect(state.feeds.global.items).toEqual([post, post2])
  })

  it('createPost.fulfilled prepende no feed do escopo certo', () => {
    const initial = reducer(undefined, { type: '@@INIT' })
    const formData = new FormData()
    formData.append('escopo', 'global')
    formData.append('conteudo', 'oi')
    const state = reducer(initial, createPost.fulfilled(post, 'reqId', formData))
    expect(state.feeds.global.items[0]).toEqual(post)
  })
})
