import { GatewayPagamentoFormPage } from '@/src/features/gateways-pagamento/components/gateway-pagamento-form-page';

export default async function EditarGatewayPagamentoPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <GatewayPagamentoFormPage id={id} />;
}
