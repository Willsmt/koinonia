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
        <span className="pointer-events-none absolute bottom-1/2 right-full mr-3 translate-y-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          Reportar um problema
        </span>
        <button
          onClick={abrir}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-800 text-2xl text-white shadow-lg hover:bg-gray-900"
        >
          🐞
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Reportar um problema</h2>
              <button onClick={fechar} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            {createStatus === 'succeeded' ? (
              <p className="text-sm text-green-600">Obrigado! Seu relato foi enviado.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={4}
                  placeholder="O que aconteceu? Quanto mais detalhe, melhor..."
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />

                {imagemPreview && (
                  <img src={imagemPreview} alt="Prévia" className="max-h-32 rounded object-cover" />
                )}

                <label className="inline-block cursor-pointer rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">
                  📷 {imagem ? 'Trocar print' : 'Anexar print (opcional)'}
                  <input type="file" accept="image/*" onChange={handleImagemChange} className="hidden" />
                </label>

                <p className="text-xs text-gray-400">Página: {location.pathname}</p>

                {erroLocal && <p className="text-sm text-red-600">{erroLocal}</p>}
                {createFieldErrors?.descricao && (
                  <p className="text-sm text-red-600">{createFieldErrors.descricao[0]}</p>
                )}
                {createFieldErrors?.imagem && <p className="text-sm text-red-600">{createFieldErrors.imagem[0]}</p>}
                {createError && <p className="text-sm text-red-600">{createError}</p>}

                <button
                  type="submit"
                  disabled={createStatus === 'loading'}
                  className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
