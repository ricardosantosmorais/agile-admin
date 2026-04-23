import { IntegracaoComErpParametrosCadastroFormPage } from '@/src/features/integracao-com-erp-parametros-cadastro/components/integracao-com-erp-parametros-cadastro-form-page'

export default async function EditarIntegracaoComErpParametroCadastroRoutePage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params

	return <IntegracaoComErpParametrosCadastroFormPage id={id} />
}
