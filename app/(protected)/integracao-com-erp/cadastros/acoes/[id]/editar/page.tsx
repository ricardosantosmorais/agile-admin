import { IntegracaoComErpAcoesFormPage } from '@/src/features/integracao-com-erp-acoes/components/integracao-com-erp-acoes-form-page'

export default async function EditarAcaoRoutePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	return <IntegracaoComErpAcoesFormPage id={id} />
}
