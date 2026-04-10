import type { ReactNode } from 'react'

type FormRowProps = {
  label: string
  children: ReactNode
  className?: string
  contentClassName?: string
  helperText?: string | null
  required?: boolean
}

export function FormRow({ label, children, className = '', contentClassName = '', helperText = null, required = false }: FormRowProps) {
  return (
    <div className={['grid items-start gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8', className].join(' ').trim()}>
      <div className="pt-2.5 text-[13px] font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </div>
      <div className={['min-w-0', contentClassName].join(' ').trim()}>
        {children}
        {helperText ? <p className="mt-1.5 text-xs text-slate-500">{helperText}</p> : null}
      </div>
    </div>
  )
}
