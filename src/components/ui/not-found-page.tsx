import Link from 'next/link'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-lg rounded-3xl border border-line/70 bg-panel px-8 py-10 text-center shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent">404</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Pagina nao encontrada</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Esta rota ainda nao existe no admin novo. A base ja esta preparada para ampliarmos os modulos daqui em diante.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white"
        >
          Voltar para o dashboard
        </Link>
      </div>
    </div>
  )
}
