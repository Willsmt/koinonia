import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { login } from './authSlice'
import { AuthLayout } from './AuthLayout'
import { AuthField } from './AuthField'

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
    <AuthLayout activeTab="login">
      <h2 className="mb-5 font-display text-2xl font-semibold text-ink-strong sm:text-[26px]">Bem-vindo de volta</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <AuthField
          label="Usuário"
          {...register('username')}
          error={errors.username?.message ?? fieldErrors?.username?.[0]}
        />
        <AuthField
          label="Senha"
          type="password"
          {...register('password')}
          error={errors.password?.message ?? fieldErrors?.password?.[0]}
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="mt-1 flex h-[46px] w-full items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {status === 'loading' ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="text-center text-sm text-ink-muted">
          Não tem conta?{' '}
          <Link to="/registro" className="font-medium text-primary hover:text-primary-hover hover:underline">
            Cadastre-se
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
