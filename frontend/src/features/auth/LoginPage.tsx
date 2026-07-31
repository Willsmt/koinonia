import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { login } from './authSlice'

const schema = z.object({
  username: z.string().min(1, 'Obrigatório'),
  password: z.string().min(1, 'Obrigatório'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, error, fieldErrors } = useAppSelector((state) => state.auth)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    const result = await dispatch(login(values))
    if (login.fulfilled.match(result)) {
      navigate('/')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold">Entrar</h1>

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
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          {fieldErrors?.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password[0]}</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'loading' ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Não tem conta?{' '}
          <Link to="/registro" className="text-blue-600 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  )
}
