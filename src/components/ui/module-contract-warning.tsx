import Link from 'next/link'
import { AlertTriangle, Store } from 'lucide-react'

type ModuleContractWarningProps = {
  title: string
  description: string
  actionLabel: string
  href: string
  testId?: string
}

export function ModuleContractWarning({
  title,
  description,
  actionLabel,
  href,
  testId,
}: ModuleContractWarningProps) {
  return (
    <div data-testid={testId} className="app-warning-panel flex flex-col gap-3 rounded-[1.15rem] px-4 py-3 text-sm font-semibold md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[color:var(--app-text)]">{title}</p>
          <p className="mt-0.5 text-xs font-medium text-[color:var(--app-muted)]">{description}</p>
        </div>
      </div>
      <Link href={href} className="app-button-secondary inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
        <Store className="h-4 w-4" />
        {actionLabel}
      </Link>
    </div>
  )
}
