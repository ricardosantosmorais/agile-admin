'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { categoriasTarefasClient } from '@/src/features/categorias-tarefas/services/categorias-tarefas-client'
import { CATEGORIAS_TAREFAS_CONFIG } from '@/src/features/categorias-tarefas/services/categorias-tarefas-config'

export function CategoriasTarefasListPage() {
  return <CrudListPage config={CATEGORIAS_TAREFAS_CONFIG} client={categoriasTarefasClient} />
}
