import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { register as registerThunk } from './authSlice'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'
import { AuthLayout } from './AuthLayout'
import { AuthField } from './AuthField'

function telefoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const schema = z
  .object({
    nome: z.string().min(1, 'Obrigatório'),
    apelido: z.string().optional(),
    email: z.string().min(1, 'Obrigatório').email('Email inválido'),
    telefone: z.string().optional(),
    username: z
      .string()
      .min(1, 'Obrigatório')
      .regex(/^[\w.@+-]+$/, 'Apenas letras, números e @ . + - _'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, error, fieldErrors } = useAppSelector((state) => state.auth)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const password = watch('password') ?? ''

  async function onSubmit(values: FormValues) {
    const result = await dispatch(
      registerThunk({
        username: values.username,
        password: values.password,
        email: values.email,
        nome: values.nome,
        apelido: values.apelido || undefined,
        telefone: values.telefone ? values.telefone.replace(/\D/g, '') : undefined,
      }),
    )
    if (registerThunk.fulfilled.match(result)) {
      navigate('/')
    }
  }

  return (
    <AuthLayout activeTab="cadastro">
      <h2 className="mb-5 font-display text-2xl font-semibold text-ink-strong sm:text-[26px]">Criar conta</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <AuthField label="Nome" {...register('nome')} error={errors.nome?.message ?? fieldErrors?.nome?.[0]} />

        <AuthField label="Apelido" hint="(opcional)" {...register('apelido')} error={fieldErrors?.apelido?.[0]} />

        <AuthField
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message ?? fieldErrors?.email?.[0]}
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
          error={fieldErrors?.telefone?.[0]}
        />

        <AuthField
          label="Usuário"
          {...register('username')}
          error={errors.username?.message ?? fieldErrors?.username?.[0]}
        />

        <AuthField
          label="Senha"
          type="password"
          {...register('password')}
          belowInput={<PasswordStrengthMeter password={password} />}
          error={errors.password?.message ?? fieldErrors?.password?.[0]}
        />

        <AuthField label="Confirmar senha" type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="mt-1 flex h-[46px] w-full items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {status === 'loading' ? 'Criando conta...' : 'Criar conta'}
        </button>

        <p className="text-center text-sm text-ink-muted">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-hover hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
