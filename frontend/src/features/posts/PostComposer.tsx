import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { createPost } from './postsSlice'
import { fetchMyMembership, fetchCelulas, fetchRedes } from '../church/churchSlice'

const schema = z.object({
  escopo: z.enum(['global', 'celula', 'rede']),
  conteudo: z.string().min(1, 'Escreve alguma coisa antes de publicar.'),
  celula: z.string().optional(),
  rede: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function PostComposer() {
  const dispatch = useAppDispatch()
  const { createStatus, createError, createFieldErrors } = useAppSelector((state) => state.posts)
  const profile = useAppSelector((state) => state.profile.data)
  const { myMembership, celulas, redes } = useAppSelector((state) => state.church)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { escopo: 'global' } })

  const escopo = watch('escopo')
  const role = myMembership?.role ?? null
  const canCelula = role === 'member' || role === 'cell_leader' || role === 'pastor'
  const canRede = role === 'network_leader' || role === 'pastor'

  useEffect(() => {
    if (profile) {
      dispatch(fetchMyMembership(profile.id))
    }
  }, [dispatch, profile])

  useEffect(() => {
    if (role === 'pastor') {
      dispatch(fetchCelulas())
      dispatch(fetchRedes())
    }
  }, [dispatch, role])

  async function onSubmit(values: FormValues) {
    const payload: { escopo: FormValues['escopo']; conteudo: string; celula?: number; rede?: number } = {
      escopo: values.escopo,
      conteudo: values.conteudo,
    }

    if (values.escopo === 'celula') {
      const celulaId = role === 'pastor' ? Number(values.celula) : (myMembership?.celula ?? 0)
      if (!celulaId) {
        setError('celula', { message: 'Selecione uma célula.' })
        return
      }
      payload.celula = celulaId
    }

    if (values.escopo === 'rede') {
      const redeId = role === 'pastor' ? Number(values.rede) : (myMembership?.rede ?? 0)
      if (!redeId) {
        setError('rede', { message: 'Selecione uma rede.' })
        return
      }
      payload.rede = redeId
    }

    const result = await dispatch(createPost(payload))
    if (createPost.fulfilled.match(result)) {
      reset({ escopo: values.escopo, conteudo: '', celula: '', rede: '' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-lg bg-white p-4 shadow">
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1">
          <input type="radio" value="global" {...register('escopo')} />
          Global
        </label>
        {canCelula && (
          <label className="flex items-center gap-1">
            <input type="radio" value="celula" {...register('escopo')} />
            Célula
          </label>
        )}
        {canRede && (
          <label className="flex items-center gap-1">
            <input type="radio" value="rede" {...register('escopo')} />
            Rede
          </label>
        )}
      </div>

      {escopo === 'celula' && role === 'pastor' && (
        <div>
          <select {...register('celula')} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
            <option value="">Selecione a célula...</option>
            {celulas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.rede_display})
              </option>
            ))}
          </select>
          {errors.celula && <p className="mt-1 text-sm text-red-600">{errors.celula.message}</p>}
        </div>
      )}

      {escopo === 'rede' && role === 'pastor' && (
        <div>
          <select {...register('rede')} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
            <option value="">Selecione a rede...</option>
            {redes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
          {errors.rede && <p className="mt-1 text-sm text-red-600">{errors.rede.message}</p>}
        </div>
      )}

      <textarea
        {...register('conteudo')}
        rows={3}
        placeholder="Compartilhe algo com a igreja..."
        className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
      />
      {errors.conteudo && <p className="text-sm text-red-600">{errors.conteudo.message}</p>}
      {createFieldErrors?.celula && <p className="text-sm text-red-600">{createFieldErrors.celula[0]}</p>}
      {createFieldErrors?.rede && <p className="text-sm text-red-600">{createFieldErrors.rede[0]}</p>}
      {createFieldErrors?.conteudo && <p className="text-sm text-red-600">{createFieldErrors.conteudo[0]}</p>}
      {createError && <p className="text-sm text-red-600">{createError}</p>}

      <button
        type="submit"
        disabled={createStatus === 'loading'}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {createStatus === 'loading' ? 'Publicando...' : 'Publicar'}
      </button>
    </form>
  )
}
