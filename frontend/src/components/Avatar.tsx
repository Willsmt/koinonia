import { useState } from 'react'
interface AvatarProps {
  src?: string | null
  size?: string
  alt?: string
  zoomable?: boolean
}
export function Avatar({ src, size = 'h-10 w-10', alt = '', zoomable = false }: AvatarProps) {
  const [open, setOpen] = useState(false)
  if (!src) {
    return (
      <div className={`${size} flex items-center justify-center rounded-full bg-surface-muted text-ink-faint`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-2/3 w-2/3">
          <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.2c-3.3 0-9.8 1.6-9.8 4.9v2.7h19.6v-2.7c0-3.3-6.5-4.9-9.8-4.9z" />
        </svg>
      </div>
    )
  }
  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={zoomable ? () => setOpen(true) : undefined}
        className={`${size} rounded-full object-cover ${zoomable ? 'cursor-zoom-in' : ''}`}
      />
      {zoomable && open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          onClick={() => setOpen(false)}
        >
          <img src={src} alt={alt} className="max-h-[80vh] max-w-[90vw] rounded-[6px] object-contain" />
        </div>
      )}
    </>
  )
}
