'use client';

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page';
import { GATEWAYS_PAGAMENTO_CONFIG } from '../services/gateways-pagamento-config';
import { gatewaysPagamentoCrudClient } from '../services/gateways-pagamento-crud-client';

export function GatewayPagamentoFormPage({ id }: { id?: string }) {
	return <CrudFormPage config={GATEWAYS_PAGAMENTO_CONFIG} client={gatewaysPagamentoCrudClient} id={id} />;
}
