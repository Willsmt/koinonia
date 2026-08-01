import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { createBugReport, resetCreateStatus } from './reportsSlice'

export function BugReportButton() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const { createStatus, createError, createFieldErrors } = useAppSelector((state) => state.reports)
  const [open, setOpen] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [imagem, setImagem] = useState<File | null>(null)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [erroLocal, setErroLocal] = useState('')

  function abrir() {
    setOpen(true)
    dispatch(resetCreateStatus())
  }

  function fechar() {
    setOpen(false)
    setDescricao('')
    setImagem(null)
    setImagemPreview(null)
    setErroLocal('')
  }

  function handleImagemChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setErroLocal('Imagem maior que 2MB.')
      return
    }
    setErroLocal('')
    setImagem(file)
    setImagemPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!descricao.trim()) {
      setErroLocal('Descreve o que aconteceu.')
      return
    }
    setErroLocal('')

    const formData = new FormData()
    formData.append('descricao', descricao)
    formData.append('pagina', location.pathname)
    if (imagem) formData.append('imagem', imagem)

    const result = await dispatch(createBugReport(formData))
    if (createBugReport.fulfilled.match(result)) {
      setTimeout(fechar, 1500)
    }
  }

  return (
    <>
      <div className="group fixed bottom-5 right-5 z-40">
        <span className="pointer-events-none absolute bottom-1/2 right-full mr-3 translate-y-1/2 whitespace-nowrap rounded bg-surface px-2 py-1 text-xs text-ink-strong opacity-0 shadow-halo-sm transition-opacity group-hover:opacity-100">
          Reportar um problema
        </span>
        <button
          onClick={abrir}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-border-input bg-surface-muted text-2xl text-ink-strong shadow-halo hover:bg-surface"
        >
          🐞
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-soft p-4">
          <div className="w-full max-w-sm rounded-lg bg-surface p-6 shadow-halo">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-strong">Reportar um problema</h2>
              <button onClick={fechar} className="text-ink-faint hover:text-ink-strong">
                ×
              </button>
            </div>

            {createStatus === 'succeeded' ? (
              <p className="text-sm text-success">Obrigado! Seu relato foi enviado.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={4}
                  placeholder="O que aconteceu? Quanto mais detalhe, melhor..."
                  className="w-full rounded-[6px] border border-border-input bg-surface-sunken px-3 py-2 text-sm text-ink-strong placeholder:text-ink-faint focus:border-primary focus:outline-none"
                />

                {imagemPreview && <img src={imagemPreview} alt="Prévia" className="max-h-32 rounded object-cover" />}

                <label className="inline-block cursor-pointer rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-ink-default hover:bg-surface-sunken">
                  📷 {imagem ? 'Trocar print' : 'Anexar print (opcional)'}
                  <input type="file" accept="image/*" onChange={handleImagemChange} className="hidden" />
                </label>

                <p className="text-xs text-ink-faint">Página: {location.pathname}</p>

                {erroLocal && <p className="text-sm text-danger">{erroLocal}</p>}
                {createFieldErrors?.descricao && <p className="text-sm text-danger">{createFieldErrors.descricao[0]}</p>}
                {createFieldErrors?.imagem && <p className="text-sm text-danger">{createFieldErrors.imagem[0]}</p>}
                {createError && <p className="text-sm text-danger">{createError}</p>}

                <button
                  type="submit"
                  disabled={createStatus === 'loading'}
                  className="w-full rounded-full bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {createStatus === 'loading' ? 'Enviando...' : 'Enviar relato'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
