import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { fetchUserDetail } from './peopleSlice'
import { fetchAllReadable } from '../posts/postsSlice'
import { PostCard } from '../posts/PostCard'
import { FollowButton } from '../interactions/FollowButton'
import { Avatar } from '../../components/Avatar'
import { NomeColorido } from '../../components/NomeColorido'

export function PublicProfilePage() {
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)
  const dispatch = useAppDispatch()
  const myId = useAppSelector((state) => state.profile.data?.id)
  const { viewedUser, viewedUserStatus } = useAppSelector((state) => state.people)
  const allReadable = useAppSelector((state) => state.posts.allReadable)

  useEffect(() => {
    if (userId) dispatch(fetchUserDetail(userId))
  }, [dispatch, userId])

  useEffect(() => {
    if (allReadable.status === 'idle') dispatch(fetchAllReadable())
  }, [dispatch, allReadable.status])

  const posts = allReadable.items.filter((p) => p.author === userId)

  if (viewedUserStatus === 'loading' || viewedUserStatus === 'idle') {
    return <p className="text-ink-subtle">Carregando...</p>
  }
  if (!viewedUser) {
    return <p className="text-danger">Usuário não encontrado.</p>
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 py-6 lg:py-0">
      <div className="overflow-hidden rounded-[6px] bg-surface shadow-halo-sm">
        <div className="relative h-24 bg-[linear-gradient(120deg,#1a0d2b_0%,#5b1a3d_55%,#7c1d3f_100%)] sm:h-32">
          <div className="absolute -bottom-8 left-6 overflow-hidden rounded-full border-[3px] border-primary/70 shadow-[0_0_20px_rgba(139,92,246,0.35)] sm:-bottom-10">
            <Avatar src={viewedUser.foto} size="h-16 w-16 sm:h-20 sm:w-20" zoomable />
          </div>
        </div>
        <div className="px-6 pb-6 pt-10 sm:pt-12">
          <div className="flex items-start justify-between gap-3">
            <div>
              <NomeColorido nome={viewedUser.nome_exibicao} cor={viewedUser.cor} className="font-display text-lg font-semibold" />
              <p className="text-sm text-ink-subtle">@{viewedUser.username}</p>
            </div>
            {myId !== undefined && myId !== userId && <FollowButton userId={userId} />}
          </div>
          {viewedUser.bio && <p className="mt-3 text-sm text-ink-default">{viewedUser.bio}</p>}
        </div>
      </div>

      <div className="space-y-3">
        {posts.length === 0 && <p className="text-ink-subtle">Nenhum post visível por aqui.</p>}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
