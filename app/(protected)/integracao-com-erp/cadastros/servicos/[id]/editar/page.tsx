import { IntegracaoComErpCadastroServicosFormPage } from '@/src/features/integracao-com-erp-cadastro-servicos/components/integracao-com-erp-cadastro-servicos-form-page'

export default async function EditarServicoCadastroRoutePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	return <IntegracaoComErpCadastroServicosFormPage id={id} />
}
