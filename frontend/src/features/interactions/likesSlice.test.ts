import { describe, it, expect } from 'vitest'
import reducer, { toggleLike } from './likesSlice'

describe('likesSlice', () => {
  it('toggleLike.fulfilled atualiza contador e estado de curtida', () => {
    const initial = reducer(undefined, { type: '@@INIT' })
    const state = reducer(
      initial,
      toggleLike.fulfilled({ postId: 1, count: 1, likedByMe: true, myLikeId: 42 }, 'req', { postId: 1 }),
    )
    expect(state.byPost[1].count).toBe(1)
    expect(state.byPost[1].likedByMe).toBe(true)
    expect(state.byPost[1].myLikeId).toBe(42)
  })
})
