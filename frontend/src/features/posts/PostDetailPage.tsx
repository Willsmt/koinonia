import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { fetchPostById } from './postsSlice'
import { PostCard } from './PostCard'

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const postId = Number(id)
  const dispatch = useAppDispatch()
  const { viewedPost, viewedPostStatus } = useAppSelector((state) => state.posts)

  useEffect(() => {
    if (postId) dispatch(fetchPostById(postId))
  }, [dispatch, postId])

  if (viewedPostStatus === 'loading' || viewedPostStatus === 'idle') {
    return <p className="text-gray-500">Carregando...</p>
  }
  if (!viewedPost) {
    return <p className="text-red-600">Post não encontrado (ou você não tem acesso a ele).</p>
  }

  return (
    <div className="mx-auto max-w-lg">
      <PostCard post={viewedPost} />
    </div>
  )
}
