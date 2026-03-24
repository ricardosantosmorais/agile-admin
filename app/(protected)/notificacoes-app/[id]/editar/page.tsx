import { NotificacoesAppFormPage } from '@/src/features/notificacoes-app/components/notificacoes-app-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <NotificacoesAppFormPage id={id} />
}
