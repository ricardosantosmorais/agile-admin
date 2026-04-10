import type { ReactNode } from 'react'
import { Sidebar } from '@/src/components/shell/sidebar'
import { Topbar } from '@/src/components/shell/topbar'

type AuthShellProps = {
  children: ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden p-3 lg:p-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[260px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_68%)]" />
      <div className="mx-auto flex max-w-[1580px] min-w-0 gap-4">
        <Sidebar />

        <main className="relative flex min-h-[calc(100vh-1.5rem)] min-w-0 flex-1 flex-col gap-3">
          <Topbar />
          <div className="relative z-0 min-w-0 flex-1">{children}</div>
        </main>
      </div>
    </div>
  )
}
