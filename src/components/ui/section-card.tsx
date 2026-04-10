import type { ReactNode } from 'react'

type SectionCardProps = {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({ title, description, action, children, className = '' }: SectionCardProps) {
  const hasCopy = Boolean(title || description)
  const hasHeader = Boolean(title || description || action)

  return (
    <section className={`app-card-modern min-w-0 rounded-[1.1rem] px-5 py-5 md:px-6 md:py-6 ${className}`.trim()}>
      {hasHeader ? (
        hasCopy ? (
          <div className="mb-5 flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
            <div>
              {title ? <h2 className="text-base font-bold tracking-tight text-slate-950">{title}</h2> : null}
              {description ? <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{description}</p> : null}
            </div>
            {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
          </div>
        ) : (
          <div className="mb-5">{action}</div>
        )
      ) : null}
      {children}
    </section>
  )
}
