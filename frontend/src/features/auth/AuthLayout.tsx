import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  activeTab: 'login' | 'cadastro'
}

export function AuthLayout({ children, activeTab }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-canvas lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Painel de marca */}
      <div className="relative isolate flex flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#050308_0%,#1a0d2b_45%,#3a0f3c_80%,#0a0610_100%)] px-6 py-8 sm:px-10 sm:py-10 lg:border-r lg:border-primary/20 lg:px-14 lg:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.16),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 hidden h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.2),transparent_70%)] lg:block"
        />

        <span className="relative z-10 font-wordmark text-lg font-bold uppercase tracking-[0.14em] text-white lg:text-2xl">
          koinonia
        </span>

        <div className="relative z-10 mt-8 max-w-md lg:mt-0">
          <h1 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-[54px] lg:leading-[1.05]">
            Sua igreja, em célula.
          </h1>
          <p className="mt-3 hidden text-base leading-relaxed text-white/80 sm:block lg:mt-5 lg:text-[17px]">
            Células, redes e a igreja inteira num só feed — com o cuidado de saber quem está por perto.
          </p>
        </div>

        <span className="relative z-10 hidden text-sm text-white/60 lg:block">© 2026 koinonia</span>
      </div>

      {/* Painel de formulário */}
      <div className="flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-7 flex gap-2 rounded-full bg-surface p-1 shadow-halo-sm">
            <Link
              to="/login"
              className={`flex-1 rounded-full py-2.5 text-center text-sm font-semibold transition-colors ${
                activeTab === 'login' ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink-default'
              }`}
            >
              Entrar
            </Link>
            <Link
              to="/registro"
              className={`flex-1 rounded-full py-2.5 text-center text-sm font-semibold transition-colors ${
                activeTab === 'cadastro' ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink-default'
              }`}
            >
              Criar conta
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
