'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { categoriasTarefasClient } from '@/src/features/categorias-tarefas/services/categorias-tarefas-client'
import { CATEGORIAS_TAREFAS_CONFIG } from '@/src/features/categorias-tarefas/services/categorias-tarefas-config'

export function CategoriaTarefaFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={CATEGORIAS_TAREFAS_CONFIG} client={categoriasTarefasClient} id={id} />
}
