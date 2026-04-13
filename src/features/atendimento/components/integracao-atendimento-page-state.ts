'use client';

import { useCallback, useMemo, useState } from 'react';
import type { IntegracaoAtendimentoBranchRow, IntegracaoAtendimentoRecord, IntegracaoAtendimentoValues } from '@/src/features/atendimento/services/integracao-atendimento-mappers';

type Params = {
	initialRecord: IntegracaoAtendimentoRecord;
	values: IntegracaoAtendimentoValues;
	setValues: React.Dispatch<React.SetStateAction<IntegracaoAtendimentoValues>>;
	branches: IntegracaoAtendimentoBranchRow[];
	setBranches: React.Dispatch<React.SetStateAction<IntegracaoAtendimentoBranchRow[]>>;
};

export function useIntegracaoAtendimentoPageState({ initialRecord, values, setValues, branches, setBranches }: Params) {
	const [tokenEditable, setTokenEditable] = useState(false);

	const resetTokenEditable = useCallback((record: IntegracaoAtendimentoRecord) => {
		setTokenEditable(!record.values.whatsappApiToken);
	}, []);

	const hasToken = initialRecord.values.whatsappApiToken.trim().length > 0;
	const shouldIncludeTokenOnSave = tokenEditable || !hasToken;

	const hasChanges = useMemo(() => {
		if (values.whatsappExibicao !== initialRecord.values.whatsappExibicao) return true;
		if (values.whatsappGateway !== initialRecord.values.whatsappGateway) return true;
		if (values.jivoJs !== initialRecord.values.jivoJs) return true;
		if (values.ebitCodigo !== initialRecord.values.ebitCodigo) return true;
		if (tokenEditable && values.whatsappApiToken !== initialRecord.values.whatsappApiToken) return true;

		if (branches.length !== initialRecord.branches.length) return true;
		for (let index = 0; index < branches.length; index += 1) {
			const current = branches[index];
			const initial = initialRecord.branches[index];
			if (!initial) return true;
			if (current.whatsappNumero !== initial.whatsappNumero) return true;
			if (current.whatsappIdNumero !== initial.whatsappIdNumero) return true;
		}

		return false;
	}, [branches, initialRecord.branches, initialRecord.values, tokenEditable, values]);

	const updateBranch = useCallback(
		(index: number, patch: Partial<IntegracaoAtendimentoBranchRow>) => {
			setBranches((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
		},
		[setBranches],
	);

	const patchValues = useCallback(
		(patch: Partial<IntegracaoAtendimentoValues>) => {
			setValues((current) => ({ ...current, ...patch }));
		},
		[setValues],
	);

	return {
		tokenEditable,
		setTokenEditable,
		resetTokenEditable,
		hasToken,
		shouldIncludeTokenOnSave,
		hasChanges,
		updateBranch,
		patchValues,
	};
}
