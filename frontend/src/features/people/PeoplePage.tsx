import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { searchUsers } from './peopleSlice'
import { FollowButton } from '../interactions/FollowButton'

export function PeoplePage() {
  const dispatch = useAppDispatch()
  const { results, status } = useAppSelector((state) => state.people)
  const myId = useAppSelector((state) => state.profile.data?.id)
  const [term, setTerm] = useState('')

  useEffect(() => {
    dispatch(searchUsers(''))
  }, [dispatch])

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    dispatch(searchUsers(term))
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por nome, apelido ou usuário..."
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Buscar
        </button>
      </form>

      {status === 'loading' && <p className="text-gray-500">Carregando...</p>}

      <div className="space-y-2">
        {results.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow">
            <Link to={`/pessoas/${user.id}`} className="flex items-center gap-3">
              {user.foto ? (
                <img src={user.foto} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-200" />
              )}
              <div>
                <p className="font-medium hover:underline">{user.nome_exibicao}</p>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>
            </Link>
            {myId !== undefined && user.id !== myId && <FollowButton userId={user.id} />}
          </div>
        ))}
      </div>
    </div>
  )
}
