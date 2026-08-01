import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { register as registerThunk } from './authSlice'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-8">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold">Criar conta</h1>

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
          {fieldErrors?.nome && <p className="mt-1 text-sm text-red-600">{fieldErrors.nome[0]}</p>}
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
          {fieldErrors?.apelido && <p className="mt-1 text-sm text-red-600">{fieldErrors.apelido[0]}</p>}
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
          {fieldErrors?.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email[0]}</p>}
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
          {fieldErrors?.telefone && <p className="mt-1 text-sm text-red-600">{fieldErrors.telefone[0]}</p>}
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Usuário
          </label>
          <input
            id="username"
            type="text"
            {...register('username')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
          {fieldErrors?.username && <p className="mt-1 text-sm text-red-600">{fieldErrors.username[0]}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Senha
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          <PasswordStrengthMeter password={password} />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          {fieldErrors?.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password[0]}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'loading' ? 'Criando conta...' : 'Criar conta'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Já tem conta?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  )
}
