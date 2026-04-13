'use client';

import { useCallback, useMemo, useState } from 'react';
import type {
	ClearSaleConfig,
	FinanceiroGatewayBranchRow,
	IntegracaoFinanceiroRecord,
	KondutoConfig,
} from '@/src/features/integracoes-financeiro/types/integracao-financeiro.types';

type Params = {
	initialRecord: IntegracaoFinanceiroRecord;
	branches: FinanceiroGatewayBranchRow[];
	setBranches: React.Dispatch<React.SetStateAction<FinanceiroGatewayBranchRow[]>>;
	clearSale: ClearSaleConfig;
	setClearSale: React.Dispatch<React.SetStateAction<ClearSaleConfig>>;
	konduto: KondutoConfig;
	setKonduto: React.Dispatch<React.SetStateAction<KondutoConfig>>;
};

export function useIntegracaoFinanceiroPageState({ initialRecord, branches, setBranches, clearSale, setClearSale, konduto, setKonduto }: Params) {
	const [senhaEditable, setSenhaEditable] = useState(false);
	const [chavePrivadaEditable, setChavePrivadaEditable] = useState(false);

	const resetEditableState = useCallback((record: IntegracaoFinanceiroRecord) => {
		setSenhaEditable(!record.clearSale.senha);
		setChavePrivadaEditable(!record.konduto.chavePrivada);
	}, []);

	const hasChanges = useMemo(() => {
		if (JSON.stringify(clearSale) !== JSON.stringify(initialRecord.clearSale)) return true;
		if (JSON.stringify(konduto) !== JSON.stringify(initialRecord.konduto)) return true;
		if (JSON.stringify(branches) !== JSON.stringify(initialRecord.branches)) return true;
		return false;
	}, [branches, clearSale, initialRecord, konduto]);

	const updateBranch = useCallback(
		(branchId: string, field: 'gatewayBoleto' | 'gatewayCartao' | 'gatewayPix', value: string) => {
			setBranches((current) => current.map((branch) => (branch.id === branchId ? { ...branch, [field]: value } : branch)));
		},
		[setBranches],
	);

	const patchClearSale = useCallback(
		<K extends keyof ClearSaleConfig>(key: K, value: ClearSaleConfig[K]) => {
			setClearSale((current) => ({ ...current, [key]: value }));
		},
		[setClearSale],
	);

	const patchKonduto = useCallback(
		<K extends keyof KondutoConfig>(key: K, value: KondutoConfig[K]) => {
			setKonduto((current) => ({ ...current, [key]: value }));
		},
		[setKonduto],
	);

	return {
		senhaEditable,
		setSenhaEditable,
		chavePrivadaEditable,
		setChavePrivadaEditable,
		resetEditableState,
		hasChanges,
		updateBranch,
		patchClearSale,
		patchKonduto,
	};
}
