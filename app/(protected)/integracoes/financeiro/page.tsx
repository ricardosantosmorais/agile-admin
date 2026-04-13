import { IntegracaoFinanceiroPage } from '@/src/features/integracoes-financeiro/components/integracao-financeiro-page';

/**
 * Página: Integrações > Financeiro
 *
 * Route: /integracoes/financeiro
 */
export const metadata = {
	title: 'Integrações - Financeiro',
};

export default function Page() {
	return <IntegracaoFinanceiroPage />;
}
