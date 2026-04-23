import { IntegracaoComErpQueriesFormPage } from '@/src/features/integracao-com-erp-queries/components/integracao-com-erp-queries-form-page'

export default async function EditarQueryRoutePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	return <IntegracaoComErpQueriesFormPage id={id} />
}
