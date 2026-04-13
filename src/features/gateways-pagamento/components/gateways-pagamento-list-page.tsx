'use client';

import { CrudListPage } from '@/src/components/crud-base/crud-list-page';
import { GATEWAYS_PAGAMENTO_CONFIG } from '../services/gateways-pagamento-config';
import { gatewaysPagamentoCrudClient } from '../services/gateways-pagamento-crud-client';

export function GatewaysPagamentoListPage() {
	return <CrudListPage config={GATEWAYS_PAGAMENTO_CONFIG} client={gatewaysPagamentoCrudClient} />;
}
