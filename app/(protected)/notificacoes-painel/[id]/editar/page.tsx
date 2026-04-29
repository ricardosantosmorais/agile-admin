import { NotificacaoPainelFormPage } from '@/src/features/notificacoes-painel/components/notificacao-painel-form-page'

export default async function EditarNotificacaoPainelRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <NotificacaoPainelFormPage id={id} />
}
