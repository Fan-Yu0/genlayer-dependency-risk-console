import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: ReactNode
}

export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className={`field ${error ? 'field-error' : ''}`}>
      <div className="field-heading">
        <label htmlFor={htmlFor}>{label}</label>
        {hint && <span>{hint}</span>}
      </div>
      {children}
      {error && <p className="field-message">{error}</p>}
    </div>
  )
}
