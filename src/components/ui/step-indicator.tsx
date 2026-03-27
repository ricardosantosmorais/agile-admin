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
                  'inline-flex items-center gap-3 rounded-full border px-4 py-2.5 text-left transition',
                  isActive ? 'border-slate-950 bg-slate-950 text-white' : isDone ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-[#e6dfd3] bg-white text-slate-700',
                  onStepClick ? '' : 'cursor-default',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                    isActive ? 'bg-white/15 text-white' : isDone ? 'bg-emerald-600 text-white' : 'bg-[#f4efe6] text-slate-700',
                  ].join(' ')}
                >
                  {index + 1}
                </span>
                <span className="whitespace-nowrap text-sm font-semibold">{item.label}</span>
              </button>
              {index < items.length - 1 ? <div className="h-px w-10 bg-[#e6dfd3]" /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
