import { IntegracaoComErpParametrosGrupoFormPage } from '@/src/features/integracao-com-erp-parametros-grupo/components/integracao-com-erp-parametros-grupo-form-page'

export default async function IntegracaoComErpParametrosGrupoEditarRoutePage(props: { params: Promise<{ id: string }> }) {
	const { id } = await props.params
	return <IntegracaoComErpParametrosGrupoFormPage id={id} />
}
