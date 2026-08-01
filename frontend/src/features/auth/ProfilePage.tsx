import { useEffect, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { fetchMe, updateProfile } from './profileSlice'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'
import { Avatar } from '../../components/Avatar'

function telefoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function telefoneParaExibicao(e164: string | null): string {
  if (!e164) return ''
  const digits = e164.replace(/\D/g, '')
  const local = digits.startsWith('55') ? digits.slice(2) : digits
  return telefoneMask(local)
}

const schema = z
  .object({
    email: z.string().min(1, 'Obrigatório').email('Email inválido'),
    nome: z.string().min(1, 'Obrigatório'),
    apelido: z.string().optional(),
    telefone: z.string().optional(),
    bio: z.string().optional(),
    novaSenha: z.string().optional(),
    confirmarNovaSenha: z.string().optional(),
  })
  .refine((data) => !data.novaSenha || data.novaSenha.length >= 8, {
    message: 'Mínimo 8 caracteres',
    path: ['novaSenha'],
  })
  .refine((data) => data.novaSenha === data.confirmarNovaSenha, {
    message: 'As senhas não coincidem.',
    path: ['confirmarNovaSenha'],
  })

type FormValues = z.infer<typeof schema>

export function ProfilePage() {
  const dispatch = useAppDispatch()
  const { data, status, updateStatus, updateError, updateFieldErrors } = useAppSelector((state) => state.profile)
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const novaSenha = watch('novaSenha') ?? ''

  useEffect(() => {
    dispatch(fetchMe())
  }, [dispatch])

  useEffect(() => {
    if (data) {
      reset({
        email: data.email,
        nome: data.nome,
        apelido: data.apelido,
        telefone: telefoneParaExibicao(data.telefone),
        bio: data.bio,
        novaSenha: '',
        confirmarNovaSenha: '',
      })
    }
  }, [data, reset])

  function handleFotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Imagem maior que 5MB.')
      return
    }
    setFoto(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function onSubmit(values: FormValues) {
    const formData = new FormData()
    formData.append('email', values.email)
    formData.append('nome', values.nome)
    formData.append('apelido', values.apelido ?? '')
    formData.append('bio', values.bio ?? '')
    if (values.telefone) {
      formData.append('telefone', values.telefone.replace(/\D/g, ''))
    }
    if (values.novaSenha) {
      formData.append('password', values.novaSenha)
    }
    if (foto) {
      formData.append('foto', foto)
    }
    await dispatch(updateProfile(formData))
  }

  if (status === 'loading' || status === 'idle') {
    return <p className="text-gray-500">Carregando perfil...</p>
  }

  if (!data) {
    return <p className="text-red-600">Não foi possível carregar o perfil.</p>
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center gap-4">
          <Avatar src={fotoPreview ?? data.foto} size="h-16 w-16" zoomable />
          <div>
            <p className="font-semibold">{data.nome_exibicao || data.username}</p>
            <p className="text-sm text-gray-500">
              @{data.username} · desde {new Date(data.date_joined).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">Editar perfil</h2>

        <div>
          <label htmlFor="foto" className="block text-sm font-medium text-gray-700">
            Foto
          </label>
          <input id="foto" type="file" accept="image/*" onChange={handleFotoChange} className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100" />
        </div>

        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            id="nome"
            type="text"
            {...register('nome')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>}
          {updateFieldErrors?.nome && <p className="mt-1 text-sm text-red-600">{updateFieldErrors.nome[0]}</p>}
        </div>

        <div>
          <label htmlFor="apelido" className="block text-sm font-medium text-gray-700">
            Apelido <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            id="apelido"
            type="text"
            {...register('apelido')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          {updateFieldErrors?.apelido && <p className="mt-1 text-sm text-red-600">{updateFieldErrors.apelido[0]}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          {updateFieldErrors?.email && <p className="mt-1 text-sm text-red-600">{updateFieldErrors.email[0]}</p>}
        </div>

        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
            Telefone <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            id="telefone"
            type="tel"
            placeholder="(11) 99999-9999"
            {...register('telefone', {
              onChange: (e) => {
                e.target.value = telefoneMask(e.target.value)
              },
            })}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          {updateFieldErrors?.telefone && (
            <p className="mt-1 text-sm text-red-600">{updateFieldErrors.telefone[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            Bio <span className="text-gray-400">(opcional)</span>
          </label>
          <textarea
            id="bio"
            rows={3}
            {...register('bio')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          {updateFieldErrors?.bio && <p className="mt-1 text-sm text-red-600">{updateFieldErrors.bio[0]}</p>}
        </div>

        <fieldset className="space-y-4 border-t pt-4">
          <legend className="text-sm font-medium text-gray-700">Alterar senha (opcional)</legend>

          <div>
            <label htmlFor="novaSenha" className="block text-sm font-medium text-gray-700">
              Nova senha
            </label>
            <input
              id="novaSenha"
              type="password"
              {...register('novaSenha')}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
            <PasswordStrengthMeter password={novaSenha} />
            {errors.novaSenha && <p className="mt-1 text-sm text-red-600">{errors.novaSenha.message}</p>}
            {updateFieldErrors?.password && (
              <p className="mt-1 text-sm text-red-600">{updateFieldErrors.password[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmarNovaSenha" className="block text-sm font-medium text-gray-700">
              Confirmar nova senha
            </label>
            <input
              id="confirmarNovaSenha"
              type="password"
              {...register('confirmarNovaSenha')}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
            {errors.confirmarNovaSenha && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmarNovaSenha.message}</p>
            )}
          </div>
        </fieldset>

        {updateError && <p className="text-sm text-red-600">{updateError}</p>}
        {updateStatus === 'succeeded' && <p className="text-sm text-green-600">Perfil atualizado.</p>}

        <button
          type="submit"
          disabled={updateStatus === 'loading'}
          className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {updateStatus === 'loading' ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}
