import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { toggleFollow } from './followSlice'

export function FollowButton({ userId }: { userId: number }) {
  const dispatch = useAppDispatch()
  const isFollowing = useAppSelector((state) => Boolean(state.follow.followingIds[userId]))

  return (
    <button
      onClick={() => dispatch(toggleFollow(userId))}
      className={`group rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        isFollowing
          ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {isFollowing ? (
        <>
          <span className="group-hover:hidden">Seguindo</span>
          <span className="hidden group-hover:inline">Deixar de seguir</span>
        </>
      ) : (
        'Seguir'
      )}
    </button>
  )
}
