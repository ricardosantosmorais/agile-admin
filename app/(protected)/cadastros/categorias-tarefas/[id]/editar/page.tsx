import { CategoriaTarefaFormPage } from '@/src/features/categorias-tarefas/components/categoria-tarefa-form-page'

export default async function EditarCategoriaTarefaRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CategoriaTarefaFormPage id={id} />
}
