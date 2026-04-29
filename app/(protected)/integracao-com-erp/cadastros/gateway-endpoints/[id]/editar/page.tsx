import { IntegracaoComErpGatewayEndpointsFormPage } from '@/src/features/integracao-com-erp-gateway-endpoints/components/integracao-com-erp-gateway-endpoints-form-page'

export default async function EditarGatewayEndpointRoutePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	return <IntegracaoComErpGatewayEndpointsFormPage id={id} />
}
