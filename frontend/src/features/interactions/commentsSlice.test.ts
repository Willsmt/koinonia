import { describe, it, expect } from 'vitest'
import reducer, { fetchComments, createComment } from './commentsSlice'

describe('commentsSlice — regressão do bug de race condition', () => {
  it('um fetchComments atrasado não apaga um comentário criado depois dele', () => {
    let state = reducer(undefined, { type: '@@INIT' })

    // 1) fetchComments dispara, mas a resposta ainda não voltou
    state = reducer(state, fetchComments.pending('req1', 1))

    // 2) createComment resolve primeiro (usuário comentou enquanto isso)
    const novoComentario = {
      id: 10,
      post: 1,
      author: 5,
      author_nome: 'wills2',
      conteudo: 'que top cara',
      created_at: '2026-08-01T00:00:00Z',
    }
    state = reducer(state, createComment.fulfilled(novoComentario, 'req2', { postId: 1, conteudo: 'que top cara' }))
    expect(state.byPost[1].items).toEqual([novoComentario])

    // 3) só agora o fetchComments antigo resolve — com uma lista de ANTES
    //    do comentário existir no servidor (simula a corrida real)
    state = reducer(state, fetchComments.fulfilled({ postId: 1, items: [] }, 'req1', 1))

    // o comentário não pode ter sumido
    expect(state.byPost[1].items).toEqual([novoComentario])
  })
})
