interface NomeColoridoProps {
  nome: string
  cor: string | null
  className?: string
}

const COR_PASTOR = '#d97706'
const COR_PADRAO = '#9ca3af'

export function NomeColorido({ nome, cor, className }: NomeColoridoProps) {
  const corFinal = cor === 'pastor' ? COR_PASTOR : (cor ?? COR_PADRAO)
  return (
    <span className={className} style={{ color: corFinal }}>
      {nome}
    </span>
  )
}
