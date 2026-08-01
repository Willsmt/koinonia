import { useEffect } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { fetchDashboardStats } from './churchSlice'

const ESCOPO_LABELS: Record<string, string> = { global: 'Global', rede: 'Rede', celula: 'Célula' }
const CORES = ['#2563eb', '#7c3aed', '#059669']

export function DashboardPage() {
  const dispatch = useAppDispatch()
  const { dashboard, dashboardStatus } = useAppSelector((state) => state.church)

  useEffect(() => {
    dispatch(fetchDashboardStats())
  }, [dispatch])

  if (dashboardStatus === 'loading' || dashboardStatus === 'idle') {
    return <p className="text-gray-500">Carregando...</p>
  }
  if (!dashboard) {
    return <p className="text-gray-500">Você não tem acesso ao dashboard.</p>
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
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-lg font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-xs text-gray-500">Total de membros</p>
          <p className="text-3xl font-bold text-blue-600">{dashboard.total_membros}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-xs text-gray-500">Célula mais ativa</p>
          <p className="text-xl font-bold text-green-600">
            {dashboard.celula_mais_ativa ? dashboard.celula_mais_ativa.nome : '—'}
          </p>
          {dashboard.celula_mais_ativa && (
            <p className="text-xs text-gray-400">{dashboard.celula_mais_ativa.total} posts</p>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Membros por célula</h2>
        {dashboard.membros_por_celula.length === 0 ? (
          <p className="text-sm text-gray-400">Sem dados ainda.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dashboard.membros_por_celula}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="nome" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Posts por escopo</h2>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={dadosEscopo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {dadosEscopo.map((_entry, idx) => (
                <Cell key={idx} fill={CORES[idx % CORES.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Posts nos últimos 14 dias</h2>
        {dadosPorDia.length === 0 ? (
          <p className="text-sm text-gray-400">Sem posts recentes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dadosPorDia}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dia" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
