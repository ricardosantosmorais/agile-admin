import { IntegracaoComErpGatewaysFormPage } from '@/src/features/integracao-com-erp-gateways/components/integracao-com-erp-gateways-form-page'

export default async function EditarGatewayRoutePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	return <IntegracaoComErpGatewaysFormPage id={id} />
}
