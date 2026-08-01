import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  belowInput?: ReactNode
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, hint, error, belowInput, id, name, ...rest }, ref) => {
    const fieldId = id ?? name

    return (
      <div>
        <label htmlFor={fieldId} className="block text-sm font-medium text-ink-muted">
          {label} {hint && <span className="text-ink-faint">{hint}</span>}
        </label>
        <input
          id={fieldId}
          name={name}
          ref={ref}
          {...rest}
          className="mt-1.5 w-full rounded-[6px] border border-border-input bg-surface-sunken px-3 py-2 text-ink-strong placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring/40"
        />
        {belowInput}
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </div>
    )
  },
)
AuthField.displayName = 'AuthField'
