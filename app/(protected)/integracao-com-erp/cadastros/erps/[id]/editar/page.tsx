import { IntegracaoComErpErpsFormPage } from '@/src/features/integracao-com-erp-erps/components/integracao-com-erp-erps-form-page'

export default async function IntegracaoComErpErpsEditarRoutePage(props: { params: Promise<{ id: string }> }) {
	const { id } = await props.params
	return <IntegracaoComErpErpsFormPage id={id} />
}
