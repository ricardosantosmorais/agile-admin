'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ClientesBranchRow, ClientesValues, IntegracaoClientesRecord } from '../services/integracao-clientes-mappers';

type UseIntegracaoClientesPageStateParams = {
	initialRecord: IntegracaoClientesRecord;
	values: ClientesValues;
	setValues: React.Dispatch<React.SetStateAction<ClientesValues>>;
	branches: ClientesBranchRow[];
	setBranches: React.Dispatch<React.SetStateAction<ClientesBranchRow[]>>;
};

export function useIntegracaoClientesPageState({ initialRecord, values, setValues, branches, setBranches }: UseIntegracaoClientesPageStateParams) {
	const [cnpjaTokenEditable, setCnpjaTokenEditable] = useState(false);
	const [croApiKeyEditable, setCroApiKeyEditable] = useState(false);
	const [unlockedBranchIds, setUnlockedBranchIds] = useState<Set<string>>(new Set());

	const resetEditableState = useCallback((record: IntegracaoClientesRecord) => {
		setCnpjaTokenEditable(!record.values.cnpjaToken);
		setCroApiKeyEditable(!record.values.croApiKey);
		setUnlockedBranchIds(new Set());
	}, []);

	const hasChanges = useMemo(() => {
		if (JSON.stringify(values) !== JSON.stringify(initialRecord.values)) return true;
		if (unlockedBranchIds.size > 0) {
			for (const branchId of unlockedBranchIds) {
				const current = branches.find((branch) => branch.id === branchId);
				const initial = initialRecord.branches.find((branch) => branch.id === branchId);
				if (current?.portalToken !== initial?.portalToken) return true;
			}
		}
		return false;
	}, [branches, initialRecord, unlockedBranchIds, values]);

	const patchValues = useCallback(
		<K extends keyof ClientesValues>(key: K, value: ClientesValues[K]) => {
			setValues((prev) => ({ ...prev, [key]: value }));
		},
		[setValues],
	);

	const updateBranchToken = useCallback(
		(branchId: string, token: string) => {
			setBranches((prev) => prev.map((branch) => (branch.id === branchId ? { ...branch, portalToken: token } : branch)));
		},
		[setBranches],
	);

	const unlockBranch = useCallback(
		(branchId: string) => {
			setUnlockedBranchIds((prev) => new Set([...prev, branchId]));
			setBranches((prev) => prev.map((branch) => (branch.id === branchId ? { ...branch, portalToken: '' } : branch)));
		},
		[setBranches],
	);

	const lockBranch = useCallback(
		(branchId: string, initialToken: string) => {
			setUnlockedBranchIds((prev) => {
				const next = new Set(prev);
				next.delete(branchId);
				return next;
			});
			setBranches((prev) => prev.map((branch) => (branch.id === branchId ? { ...branch, portalToken: initialToken } : branch)));
		},
		[setBranches],
	);

	return {
		cnpjaTokenEditable,
		setCnpjaTokenEditable,
		croApiKeyEditable,
		setCroApiKeyEditable,
		unlockedBranchIds,
		hasChanges,
		patchValues,
		updateBranchToken,
		unlockBranch,
		lockBranch,
		resetEditableState,
	};
}
