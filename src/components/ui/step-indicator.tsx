'use client'

type StepIndicatorItem = {
  id: string
  label: string
}

type StepIndicatorProps = {
  items: StepIndicatorItem[]
  activeStep: string
  onStepClick?: (id: string) => void
}

export function StepIndicator({ items, activeStep, onStepClick }: StepIndicatorProps) {
  const activeIndex = items.findIndex((item) => item.id === activeStep)

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-center gap-3">
        {items.map((item, index) => {
          const isActive = item.id === activeStep
          const isDone = activeIndex > index

          return (
            <div key={item.id} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onStepClick?.(item.id)}
                className={[
                  'inline-flex items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm font-semibold transition',
                  isActive ? 'app-button-primary' : isDone ? 'border border-emerald-400/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'app-button-secondary',
                  onStepClick ? '' : 'cursor-default',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                    isActive ? 'bg-white/15 text-white' : isDone ? 'bg-emerald-600 text-white' : 'app-control-muted text-[color:var(--app-text)]',
                  ].join(' ')}
                >
                  {index + 1}
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
              {index < items.length - 1 ? <div className="h-px w-10 bg-[color:var(--app-control-border)]" /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
