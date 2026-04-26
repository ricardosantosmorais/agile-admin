import { IntegracaoComErpEndpointsFormPage } from '@/src/features/integracao-com-erp-endpoints/components/integracao-com-erp-endpoints-form-page'

type Props = {
	params: Promise<{ id: string }>
}

export default async function EditarEndpointRoutePage({ params }: Props) {
	const { id } = await params
	return <IntegracaoComErpEndpointsFormPage id={id} />
}
