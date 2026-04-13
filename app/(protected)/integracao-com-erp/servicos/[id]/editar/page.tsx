import { IntegracaoComErpServicosEditPage } from '@/src/features/integracao-com-erp-servicos/components/integracao-com-erp-servicos-edit-page';

export default async function IntegracaoErpServicosEditarPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <IntegracaoComErpServicosEditPage serviceId={id} />;
}
