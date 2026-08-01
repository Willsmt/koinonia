import { useEffect } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { fetchDashboardStats } from './churchSlice'

const ESCOPO_LABELS: Record<string, string> = { global: 'Global', rede: 'Rede', celula: 'Célula' }
const CORES = ['#8b5cf6', '#f43f5e', '#34d399']

const tooltipStyle = {
  backgroundColor: '#131019',
  border: '1px solid #262038',
  borderRadius: 6,
  color: '#f1eefb',
  fontSize: 13,
}
const axisTick = { fill: '#a89fc4' }

export function DashboardPage() {
  const dispatch = useAppDispatch()
  const { dashboard, dashboardStatus } = useAppSelector((state) => state.church)

  useEffect(() => {
    dispatch(fetchDashboardStats())
  }, [dispatch])

  if (dashboardStatus === 'loading' || dashboardStatus === 'idle') {
    return <p className="text-ink-subtle">Carregando...</p>
  }
  if (!dashboard) {
    return <p className="text-ink-subtle">Você não tem acesso ao dashboard.</p>
  }

  const dadosEscopo = Object.entries(dashboard.posts_por_escopo).map(([escopo, total]) => ({
    name: ESCOPO_LABELS[escopo],
    value: total,
  }))

  const dadosPorDia = dashboard.posts_por_dia.map((d) => ({
    dia: new Date(d.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    total: d.total,
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6 lg:py-0">
      <h1 className="font-display text-lg font-semibold text-ink-strong">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[6px] bg-surface p-4 shadow-halo-sm">
          <p className="text-xs text-ink-subtle">Total de membros</p>
          <p className="font-display text-3xl font-bold text-primary">{dashboard.total_membros}</p>
        </div>
        <div className="rounded-[6px] bg-surface p-4 shadow-halo-sm">
          <p className="text-xs text-ink-subtle">Célula mais ativa</p>
          <p className="font-display text-xl font-bold text-success">
            {dashboard.celula_mais_ativa ? dashboard.celula_mais_ativa.nome : '—'}
          </p>
          {dashboard.celula_mais_ativa && (
            <p className="text-xs text-ink-faint">{dashboard.celula_mais_ativa.total} posts</p>
          )}
        </div>
      </div>

      <div className="rounded-[6px] bg-surface p-4 shadow-halo-sm">
        <h2 className="mb-3 text-sm font-semibold text-ink-strong">Membros por célula</h2>
        {dashboard.membros_por_celula.length === 0 ? (
          <p className="text-sm text-ink-faint">Sem dados ainda.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dashboard.membros_por_celula}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262038" />
              <XAxis dataKey="nome" fontSize={12} tick={axisTick} axisLine={{ stroke: '#262038' }} tickLine={{ stroke: '#262038' }} />
              <YAxis allowDecimals={false} fontSize={12} tick={axisTick} axisLine={{ stroke: '#262038' }} tickLine={{ stroke: '#262038' }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
              <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-[6px] bg-surface p-4 shadow-halo-sm">
        <h2 className="mb-3 text-sm font-semibold text-ink-strong">Posts por escopo</h2>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={dadosEscopo}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={{ fill: '#d7d1e8' }}
            >
              {dadosEscopo.map((_entry, idx) => (
                <Cell key={idx} fill={CORES[idx % CORES.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-[6px] bg-surface p-4 shadow-halo-sm">
        <h2 className="mb-3 text-sm font-semibold text-ink-strong">Posts nos últimos 14 dias</h2>
        {dadosPorDia.length === 0 ? (
          <p className="text-sm text-ink-faint">Sem posts recentes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dadosPorDia}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262038" />
              <XAxis dataKey="dia" fontSize={12} tick={axisTick} axisLine={{ stroke: '#262038' }} tickLine={{ stroke: '#262038' }} />
              <YAxis allowDecimals={false} fontSize={12} tick={axisTick} axisLine={{ stroke: '#262038' }} tickLine={{ stroke: '#262038' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
