import { TarefaFormPage } from '@/src/features/tarefas/components/tarefa-form-page'

export default async function EditarTarefaRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TarefaFormPage id={id} />
}
