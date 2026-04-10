import type { ReactNode } from 'react'

type FormFieldProps = {
  label: string
  children: ReactNode
  className?: string
  helperText?: string | null
  asLabel?: boolean
  required?: boolean
}

export function FormField({ label, children, className = '', helperText = null, asLabel = true, required = false }: FormFieldProps) {
  const classes = `flex flex-col gap-1.5 ${className}`.trim()
  const labelNode = (
    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
      {label}
      {required ? <span className="ml-1 text-rose-500">*</span> : null}
    </span>
  )

  if (asLabel) {
    return (
      <label className={classes}>
        {labelNode}
        {children}
        {helperText ? <span className="text-xs text-slate-500">{helperText}</span> : null}
      </label>
    )
  }

  return (
    <div className={classes}>
      {labelNode}
      {children}
      {helperText ? <span className="text-xs text-slate-500">{helperText}</span> : null}
    </div>
  )
}
