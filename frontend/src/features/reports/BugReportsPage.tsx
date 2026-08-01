import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { fetchBugReports, toggleResolvido, deleteBugReport, type BugReportItem } from './reportsSlice'
function ReportCard({ report }: { report: BugReportItem }) {
  const dispatch = useAppDispatch()
  return (
    <div className={`rounded-[6px] bg-surface p-4 shadow-halo-sm ${report.resolvido ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between text-xs text-ink-subtle">
        <span>@{report.reporter_username}</span>
        <span>{new Date(report.created_at).toLocaleString('pt-BR')}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-default">{report.descricao}</p>
      {report.pagina && <p className="mt-1 text-xs text-ink-faint">Página: {report.pagina}</p>}
      {report.imagem && <img src={report.imagem} alt="" className="mt-2 max-h-64 rounded-[6px] object-cover" />}
      <div className="mt-3 flex items-center gap-3 border-t border-border pt-2 text-xs">
        <button
          onClick={() => dispatch(toggleResolvido({ id: report.id, resolvido: !report.resolvido }))}
          className={report.resolvido ? 'text-ink-subtle hover:text-primary' : 'text-success hover:text-success/80'}
        >
          {report.resolvido ? '↺ Reabrir' : '✓ Marcar resolvido'}
        </button>
        <button
          onClick={() => {
            if (window.confirm('Excluir este relato?')) dispatch(deleteBugReport(report.id))
          }}
          className="text-danger hover:text-danger/80"
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
    return <p className="text-ink-subtle">Você não tem acesso a esta página.</p>
  }
  if (listStatus === 'loading' || listStatus === 'idle') {
    return <p className="text-ink-subtle">Carregando...</p>
  }
  const pendentes = list.filter((r) => !r.resolvido)
  const resolvidos = list.filter((r) => r.resolvido)
  return (
    <div className="mx-auto max-w-lg space-y-6 py-6 lg:py-0">
      <div>
        <h1 className="mb-3 font-display text-lg font-semibold text-ink-strong">Pendentes ({pendentes.length})</h1>
        {pendentes.length === 0 && <p className="text-ink-subtle">Nada pendente. 🎉</p>}
        <div className="space-y-3">
          {pendentes.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      </div>
      {resolvidos.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-subtle">Resolvidos ({resolvidos.length})</h2>
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
