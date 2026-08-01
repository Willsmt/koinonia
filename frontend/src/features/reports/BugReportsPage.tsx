import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { fetchBugReports, toggleResolvido, deleteBugReport, type BugReportItem } from './reportsSlice'

function ReportCard({ report }: { report: BugReportItem }) {
  const dispatch = useAppDispatch()

  return (
    <div className={`rounded-lg bg-white p-4 shadow ${report.resolvido ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>@{report.reporter_username}</span>
        <span>{new Date(report.created_at).toLocaleString('pt-BR')}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-800">{report.descricao}</p>
      {report.pagina && <p className="mt-1 text-xs text-gray-400">Página: {report.pagina}</p>}
      {report.imagem && <img src={report.imagem} alt="" className="mt-2 max-h-64 rounded-lg object-cover" />}

      <div className="mt-3 flex items-center gap-3 border-t pt-2 text-xs">
        <button
          onClick={() => dispatch(toggleResolvido({ id: report.id, resolvido: !report.resolvido }))}
          className={report.resolvido ? 'text-gray-500 hover:text-blue-600' : 'text-green-600 hover:text-green-700'}
        >
          {report.resolvido ? '↺ Reabrir' : '✓ Marcar resolvido'}
        </button>
        <button
          onClick={() => {
            if (window.confirm('Excluir este relato?')) dispatch(deleteBugReport(report.id))
          }}
          className="text-red-600 hover:text-red-700"
        >
          🗑 Excluir
        </button>
      </div>
    </div>
  )
}

export function BugReportsPage() {
  const dispatch = useAppDispatch()
  const { list, listStatus } = useAppSelector((state) => state.reports)
  const role = useAppSelector((state) => state.church.myMembership?.role ?? null)

  useEffect(() => {
    if (role === 'pastor' && listStatus === 'idle') {
      dispatch(fetchBugReports())
    }
  }, [dispatch, role, listStatus])

  if (role !== 'pastor') {
    return <p className="text-gray-500">Você não tem acesso a esta página.</p>
  }

  if (listStatus === 'loading' || listStatus === 'idle') {
    return <p className="text-gray-500">Carregando...</p>
  }

  const pendentes = list.filter((r) => !r.resolvido)
  const resolvidos = list.filter((r) => r.resolvido)

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="mb-3 text-lg font-semibold">Pendentes ({pendentes.length})</h1>
        {pendentes.length === 0 && <p className="text-gray-500">Nada pendente. 🎉</p>}
        <div className="space-y-3">
          {pendentes.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      </div>

      {resolvidos.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-500">Resolvidos ({resolvidos.length})</h2>
          <div className="space-y-3">
            {resolvidos.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
