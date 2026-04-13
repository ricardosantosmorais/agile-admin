'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import type { PasswordRules } from '@/src/lib/validators'

type PasswordRulesFeedbackProps = {
  rules: PasswordRules
  labels: {
    length: string
    uppercase: string
    number: string
    special: string
  }
}

function RuleItem({ passed, label }: { passed: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-2 ${passed ? 'font-semibold text-emerald-600 dark:text-emerald-300' : 'text-[color:var(--app-muted)]'}`}>
      {passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4 text-rose-500 dark:text-rose-300" />}
      {label}
    </li>
  )
}

export function PasswordRulesFeedback({ rules, labels }: PasswordRulesFeedbackProps) {
  return (
    <div className="app-pane-muted rounded-[1rem] px-4 py-4 text-sm">
      <ul className="space-y-1">
        <RuleItem passed={rules.length} label={labels.length} />
        <RuleItem passed={rules.uppercase} label={labels.uppercase} />
        <RuleItem passed={rules.number} label={labels.number} />
        <RuleItem passed={rules.special} label={labels.special} />
      </ul>
    </div>
  )
}
