import { useEffect, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { fetchMe, updateProfile } from './profileSlice'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'
import { AuthField } from './AuthField'
import { Avatar } from '../../components/Avatar'
import { NomeColorido } from '../../components/NomeColorido'

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
    return <p className="text-ink-subtle">Carregando perfil...</p>
  }

  if (!data) {
    return <p className="text-danger">Não foi possível carregar o perfil.</p>
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 py-6 lg:py-0">
      <div className="rounded-[6px] bg-surface p-6 shadow-halo-sm">
        <div className="flex items-center gap-4">
          <Avatar src={fotoPreview ?? data.foto} size="h-16 w-16" zoomable />
          <div>
            <NomeColorido nome={data.nome_exibicao || data.username} cor={data.cor} className="font-display text-lg font-semibold" />
            <p className="text-sm text-ink-subtle">
              @{data.username} · desde {new Date(data.date_joined).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-[6px] bg-surface p-6 shadow-halo-sm">
        <h2 className="font-display text-lg font-semibold text-ink-strong">Editar perfil</h2>

        <div>
          <label htmlFor="foto" className="block text-sm font-medium text-ink-muted">
            Foto
          </label>
          <input
            id="foto"
            type="file"
            accept="image/*"
            onChange={handleFotoChange}
            className="mt-1 block w-full text-sm text-ink-muted file:mr-4 file:rounded-full file:border-0 file:bg-primary-tint file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
          />
        </div>

        <AuthField label="Nome" {...register('nome')} error={errors.nome?.message ?? updateFieldErrors?.nome?.[0]} />

        <AuthField
          label="Apelido"
          hint="(opcional)"
          {...register('apelido')}
          error={updateFieldErrors?.apelido?.[0]}
        />

        <AuthField
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message ?? updateFieldErrors?.email?.[0]}
        />

        <AuthField
          label="Telefone"
          hint="(opcional)"
          type="tel"
          placeholder="(11) 99999-9999"
          {...register('telefone', {
            onChange: (e) => {
              e.target.value = telefoneMask(e.target.value)
            },
          })}
          error={updateFieldErrors?.telefone?.[0]}
        />

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-ink-muted">
            Bio <span className="text-ink-faint">(opcional)</span>
          </label>
          <textarea
            id="bio"
            rows={3}
            {...register('bio')}
            className="mt-1.5 w-full rounded-[6px] border border-border-input bg-surface-sunken px-3 py-2 text-ink-strong placeholder:text-ink-faint focus:border-primary focus:outline-none"
          />
          {updateFieldErrors?.bio && <p className="mt-1 text-sm text-danger">{updateFieldErrors.bio[0]}</p>}
        </div>

        <fieldset className="space-y-4 border-t border-border pt-4">
          <legend className="text-sm font-medium text-ink-muted">Alterar senha (opcional)</legend>

          <AuthField
            label="Nova senha"
            type="password"
            {...register('novaSenha')}
            belowInput={<PasswordStrengthMeter password={novaSenha} />}
            error={errors.novaSenha?.message ?? updateFieldErrors?.password?.[0]}
          />

          <AuthField
            label="Confirmar nova senha"
            type="password"
            {...register('confirmarNovaSenha')}
            error={errors.confirmarNovaSenha?.message}
          />
        </fieldset>

        {updateError && <p className="text-sm text-danger">{updateError}</p>}
        {updateStatus === 'succeeded' && <p className="text-sm text-success">Perfil atualizado.</p>}

        <button
          type="submit"
          disabled={updateStatus === 'loading'}
          className="w-full rounded-full bg-primary py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {updateStatus === 'loading' ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}
