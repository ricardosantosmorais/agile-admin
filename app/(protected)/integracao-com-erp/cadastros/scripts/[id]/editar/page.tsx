import { IntegracaoComErpScriptsFormPage } from '@/src/features/integracao-com-erp-scripts/components/integracao-com-erp-scripts-form-page'

export default async function EditarScriptRoutePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	return <IntegracaoComErpScriptsFormPage id={id} />
}
