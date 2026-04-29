'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { funcionalidadesClient } from '@/src/features/funcionalidades/services/funcionalidades-client'
import { FUNCIONALIDADES_CONFIG } from '@/src/features/funcionalidades/services/funcionalidades-config'

export function FuncionalidadesListPage() {
	return <CrudListPage config={FUNCIONALIDADES_CONFIG} client={funcionalidadesClient} />
}
