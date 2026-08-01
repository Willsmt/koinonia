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
    return <p className="text-gray-500">Carregando...</p>
  }
  if (!viewedUser) {
    return <p className="text-red-600">Usuário não encontrado.</p>
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center gap-4">
          <Avatar src={viewedUser.foto} size="h-16 w-16" zoomable />
          <div className="flex-1">
            <NomeColorido nome={viewedUser.nome_exibicao} cor={viewedUser.cor} className="text-lg font-semibold" />
            <p className="text-sm text-gray-500">@{viewedUser.username}</p>
          </div>
          {myId !== undefined && myId !== userId && <FollowButton userId={userId} />}
        </div>
        {viewedUser.bio && <p className="mt-3 text-sm text-gray-700">{viewedUser.bio}</p>}
      </div>

      <div className="space-y-3">
        {posts.length === 0 && <p className="text-gray-500">Nenhum post visível por aqui.</p>}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
