'use client';

import { IntegracaoFinanceiroGatewayTabBase } from '@/src/features/integracoes-financeiro/components/integracao-financeiro-gateway-tab-base';
import type { FinanceiroGatewayBranchRow, GatewayPagamento } from '@/src/features/integracoes-financeiro/types/integracao-financeiro.types';
import type { TranslationFn } from '@/src/features/integracoes-financeiro/components/integracao-financeiro-clearsale-tab';

type Props = {
	gateways: GatewayPagamento[];
	branches: FinanceiroGatewayBranchRow[];
	saving: boolean;
	canEdit: boolean;
	locale: string;
	t: TranslationFn;
	onChange: (branchId: string, field: 'gatewayBoleto' | 'gatewayCartao' | 'gatewayPix', value: string) => void;
};

export function IntegracaoFinanceiroPixTab(props: Props) {
	const { t } = props;
	return (
		<IntegracaoFinanceiroGatewayTabBase
			{...props}
			tipo="pix"
			title={t('integrationsFinancial.sections.pix.title', 'PIX')}
			description={t('integrationsFinancial.sections.pix.description', 'Configuracoes de integracao com o gateway de pagamento de PIX.')}
			helper={t('integrationsFinancial.sections.pix.helper', '* Gateway de Pagamento vinculado a filial para pagamentos via PIX.')}
		/>
	);
}
