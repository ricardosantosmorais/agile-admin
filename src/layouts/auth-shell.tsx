import type { ReactNode } from 'react'
import { Sidebar } from '@/src/components/shell/sidebar'
import { Topbar } from '@/src/components/shell/topbar'

type AuthShellProps = {
  children: ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen p-3 lg:p-4">
      <div className="mx-auto flex max-w-[1580px] min-w-0 gap-4">
        <Sidebar />

        <main className="flex min-h-[calc(100vh-1.5rem)] min-w-0 flex-1 flex-col gap-3">
          <Topbar />
          <div className="relative z-0 min-w-0 flex-1">{children}</div>
        </main>
      </div>
    </div>
  )
}
