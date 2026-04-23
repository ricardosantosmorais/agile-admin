import { IntegracaoComErpTemplatesFormPage } from '@/src/features/integracao-com-erp-templates/components/integracao-com-erp-templates-form-page'

export default async function IntegracaoComErpTemplatesEditarRoutePage(props: { params: Promise<{ id: string }> }) {
	const { id } = await props.params
	return <IntegracaoComErpTemplatesFormPage id={id} />
}
