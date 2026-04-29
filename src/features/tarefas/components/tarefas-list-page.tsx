'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { tarefasClient } from '@/src/features/tarefas/services/tarefas-client'
import { TAREFAS_CONFIG } from '@/src/features/tarefas/services/tarefas-config'

export function TarefasListPage() {
  return <CrudListPage config={TAREFAS_CONFIG} client={tarefasClient} />
}
