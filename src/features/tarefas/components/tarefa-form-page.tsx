'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { tarefasClient } from '@/src/features/tarefas/services/tarefas-client'
import { TAREFAS_CONFIG } from '@/src/features/tarefas/services/tarefas-config'

export function TarefaFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={TAREFAS_CONFIG} client={tarefasClient} id={id} />
}
