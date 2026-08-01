import { useEffect, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { createPost } from './postsSlice'
import { fetchMyMembership, fetchCelulas, fetchRedes } from '../church/churchSlice'

const schema = z.object({
  escopo: z.enum(['global', 'celula', 'rede']),
  conteudo: z.string().optional(),
  celula: z.string().optional(),
  rede: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function PostComposer() {
  const dispatch = useAppDispatch()
  const { createStatus, createError, createFieldErrors } = useAppSelector((state) => state.posts)
  const profile = useAppSelector((state) => state.profile.data)
  const { myMembership, celulas, redes } = useAppSelector((state) => state.church)
  const [imagem, setImagem] = useState<File | null>(null)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { escopo: 'global' } })

  const escopo = watch('escopo')
  const conteudoAtual = watch('conteudo')
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

  function handleImagemChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('conteudo', { message: 'Imagem maior que 2MB.' })
      return
    }
    setImagem(file)
    setImagemPreview(URL.createObjectURL(file))
  }

  function limparImagem() {
    setImagem(null)
    setImagemPreview(null)
  }

  async function onSubmit(values: FormValues) {
    clearErrors('conteudo')
    if (!values.conteudo?.trim() && !imagem) {
      setError('conteudo', { message: 'Escreve alguma coisa ou anexa uma imagem.' })
      return
    }

    const formData = new FormData()
    formData.append('escopo', values.escopo)
    if (values.conteudo) formData.append('conteudo', values.conteudo)
    if (imagem) formData.append('imagem', imagem)

    if (values.escopo === 'celula') {
      const celulaId = role === 'pastor' ? Number(values.celula) : (myMembership?.celula ?? 0)
      if (!celulaId) {
        setError('celula', { message: 'Selecione uma célula.' })
        return
      }
      formData.append('celula', String(celulaId))
    }

    if (values.escopo === 'rede') {
      const redeId = role === 'pastor' ? Number(values.rede) : (myMembership?.rede ?? 0)
      if (!redeId) {
        setError('rede', { message: 'Selecione uma rede.' })
        return
      }
      formData.append('rede', String(redeId))
    }

    const result = await dispatch(createPost(formData))
    if (createPost.fulfilled.match(result)) {
      reset({ escopo: values.escopo, conteudo: '', celula: '', rede: '' })
      limparImagem()
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
        <select {...register('celula')} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
          <option value="">Selecione a célula...</option>
          {celulas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome} ({c.rede_display})
            </option>
          ))}
        </select>
      )}

      {escopo === 'rede' && role === 'pastor' && (
        <select {...register('rede')} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
          <option value="">Selecione a rede...</option>
          {redes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </select>
      )}

      <textarea
        {...register('conteudo')}
        rows={3}
        maxLength={3000}
        placeholder="Compartilhe algo com a igreja... (opcional se anexar imagem)"
        className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
      />
      <p className={`text-right text-xs ${(conteudoAtual?.length ?? 0) > 2800 ? 'text-red-600' : 'text-gray-400'}`}>
        {conteudoAtual?.length ?? 0}/3000
      </p>

      {imagemPreview && (
        <div className="relative inline-block">
          <img src={imagemPreview} alt="Prévia" className="max-h-48 rounded-lg object-cover" />
          <button
            type="button"
            onClick={limparImagem}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs text-white hover:bg-gray-900"
          >
            ×
          </button>
        </div>
      )}

      <div>
        <label className="inline-block cursor-pointer rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
          📷 {imagem ? 'Trocar imagem' : 'Anexar imagem'}
          <input type="file" accept="image/*" onChange={handleImagemChange} className="hidden" />
        </label>
      </div>

      {errors.conteudo && <p className="text-sm text-red-600">{errors.conteudo.message}</p>}
      {errors.celula && <p className="text-sm text-red-600">{errors.celula.message}</p>}
      {errors.rede && <p className="text-sm text-red-600">{errors.rede.message}</p>}
      {createFieldErrors?.celula && <p className="text-sm text-red-600">{createFieldErrors.celula[0]}</p>}
      {createFieldErrors?.rede && <p className="text-sm text-red-600">{createFieldErrors.rede[0]}</p>}
      {createFieldErrors?.conteudo && <p className="text-sm text-red-600">{createFieldErrors.conteudo[0]}</p>}
      {createFieldErrors?.imagem && <p className="text-sm text-red-600">{createFieldErrors.imagem[0]}</p>}
      {createFieldErrors?.non_field_errors && (
        <p className="text-sm text-red-600">{createFieldErrors.non_field_errors[0]}</p>
      )}
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
