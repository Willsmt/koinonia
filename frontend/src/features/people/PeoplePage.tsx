import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { searchUsers } from './peopleSlice'
import { FollowButton } from '../interactions/FollowButton'
import { Avatar } from '../../components/Avatar'
import { NomeColorido } from '../../components/NomeColorido'
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
    <div className="mx-auto max-w-lg space-y-4 py-6 lg:py-0">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por nome, apelido ou usuário..."
          className="flex-1 rounded-[6px] border border-border-input bg-surface-sunken px-3 py-2 text-sm text-ink-strong placeholder:text-ink-faint focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Buscar
        </button>
      </form>
      {status === 'loading' && <p className="text-ink-subtle">Carregando...</p>}
      <div className="space-y-2">
        {results.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-[6px] bg-surface p-3 shadow-halo-sm">
            <Link to={`/pessoas/${user.id}`} className="flex items-center gap-3">
              <Avatar src={user.foto} size="h-10 w-10" />
              <div>
                <p className="hover:underline">
                  <NomeColorido nome={user.nome_exibicao} cor={user.cor} className="font-medium" />
                </p>
                <p className="text-xs text-ink-subtle">@{user.username}</p>
              </div>
            </Link>
            {myId !== undefined && user.id !== myId && <FollowButton userId={user.id} />}
          </div>
        ))}
      </div>
    </div>
  )
}
