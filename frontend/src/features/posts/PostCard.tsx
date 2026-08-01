import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import type { Post } from './postsSlice'
import { fetchLikes, toggleLike } from '../interactions/likesSlice'
import { fetchComments, createComment } from '../interactions/commentsSlice'
import { deletePost } from './postsSlice'
import { Avatar } from '../../components/Avatar'
import { FollowButton } from '../interactions/FollowButton'

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
  const [showComments, setShowComments] = useState(false)
  const [novoComentario, setNovoComentario] = useState('')
  const [imagemAmpliada, setImagemAmpliada] = useState(false)

  useEffect(() => {
    if (myId && !likeInfo) {
      dispatch(fetchLikes({ postId: post.id, myUserId: myId }))
    }
  }, [dispatch, post.id, myId, likeInfo])

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
          <Link to={`/pessoas/${post.author}`}>
            <Avatar src={post.author_foto} size="h-9 w-9" />
          </Link>
          <Link to={`/pessoas/${post.author}`} className="font-medium hover:underline">
            {post.author_nome}
          </Link>
          {myId !== undefined && post.author !== myId && <FollowButton userId={post.author} />}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {ESCOPO_LABELS[post.escopo]}
          </span>
          {myId === post.author && (
            <button
              onClick={() => {
                if (window.confirm('Excluir este post? Essa ação não pode ser desfeita.')) {
                  dispatch(deletePost(post.id))
                }
              }}
              className="text-xs text-gray-400 hover:text-red-600"
              title="Excluir post"
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {post.conteudo && <p className="mt-2 whitespace-pre-wrap break-words text-gray-800">{post.conteudo}</p>}
      {post.imagem && (
        <img
          src={post.imagem}
          alt=""
          onClick={() => setImagemAmpliada(true)}
          className="mt-2 max-h-96 w-full cursor-zoom-in rounded-lg object-cover"
        />
      )}
      {post.imagem && imagemAmpliada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setImagemAmpliada(false)}
        >
          <img src={post.imagem} alt="" className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain" />
        </div>
      )}
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
              <Link to={`/pessoas/${c.author}`} className="font-medium hover:underline">
                {c.author_nome}
              </Link>
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
