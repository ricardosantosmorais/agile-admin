import { IntegracaoComErpInterfacesConsultaFormPage } from '@/src/features/integracao-com-erp-interfaces-consulta/components/integracao-com-erp-interfaces-consulta-form-page'

export default async function EditarInterfaceConsultaRoutePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	return <IntegracaoComErpInterfacesConsultaFormPage id={id} />
}
