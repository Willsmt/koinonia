import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import type { Post } from './postsSlice'
import { fetchLikes, toggleLike } from '../interactions/likesSlice'
import { fetchComments, createComment } from '../interactions/commentsSlice'
import { toggleFollow } from '../interactions/followSlice'

const ESCOPO_LABELS: Record<Post['escopo'], string> = {
  global: 'Global',
  rede: 'Rede',
  celula: 'Célula',
}

export function PostCard({ post }: { post: Post }) {
  const dispatch = useAppDispatch()
  const myId = useAppSelector((state) => state.profile.data?.id)
  const likeInfo = useAppSelector((state) => state.likes.byPost[post.id])
  const commentsInfo = useAppSelector((state) => state.comments.byPost[post.id])
  const isFollowing = useAppSelector((state) => Boolean(state.follow.followingIds[post.author]))
  const [showComments, setShowComments] = useState(false)
  const [novoComentario, setNovoComentario] = useState('')

  useEffect(() => {
    if (myId && !likeInfo) {
      dispatch(fetchLikes({ postId: post.id, myUserId: myId }))
    }
  }, [dispatch, post.id, myId, likeInfo])

  // Carrega junto com o post (igual o like) — não espera o clique em
  // "Comentar", senão o contador mostra "0" mesmo quando já existem
  // comentários no servidor. Custo conhecido: 1 request extra por post
  // visível na tela (N+1); aceitável no volume deste projeto.
  useEffect(() => {
    if (!commentsInfo) {
      dispatch(fetchComments(post.id))
    }
  }, [dispatch, post.id, commentsInfo])

  function handleEnviarComentario() {
    if (!novoComentario.trim()) return
    dispatch(createComment({ postId: post.id, conteudo: novoComentario }))
    setNovoComentario('')
  }

  return (
    <article className="rounded-lg bg-white p-4 shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{post.author_nome}</span>
          {myId !== undefined && post.author !== myId && (
            <button
              onClick={() => dispatch(toggleFollow(post.author))}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isFollowing ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white'
              }`}
            >
              {isFollowing ? 'Seguindo' : 'Seguir'}
            </button>
          )}
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
          {ESCOPO_LABELS[post.escopo]}
        </span>
      </div>

      <p className="mt-2 whitespace-pre-wrap text-gray-800">{post.conteudo}</p>
      <p className="mt-2 text-xs text-gray-400">{new Date(post.created_at).toLocaleString('pt-BR')}</p>

      <div className="mt-3 flex items-center gap-4 border-t pt-2 text-sm">
        <button
          onClick={() => dispatch(toggleLike({ postId: post.id }))}
          className={`flex items-center gap-1 ${likeInfo?.likedByMe ? 'text-red-600' : 'text-gray-500'}`}
        >
          {likeInfo?.likedByMe ? '♥' : '♡'} {likeInfo?.count ?? 0}
        </button>
        <button onClick={() => setShowComments((v) => !v)} className="text-gray-500">
          💬 {commentsInfo?.items.length ?? 0} Comentar
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-2 border-t pt-2">
          {commentsInfo?.status === 'loading' && <p className="text-xs text-gray-400">Carregando...</p>}
          {commentsInfo?.items.map((c) => (
            <div key={c.id} className="rounded bg-gray-50 p-2 text-sm">
              <span className="font-medium">{c.author_nome}</span>
              <p className="text-gray-700">{c.conteudo}</p>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <button
              onClick={handleEnviarComentario}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
