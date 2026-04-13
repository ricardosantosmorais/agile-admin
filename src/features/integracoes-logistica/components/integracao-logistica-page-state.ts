'use client';

import { useCallback, useMemo, useState } from 'react';
import { branchTokenKey } from '@/src/features/integracoes-logistica/components/integracao-logistica-tab-shared';
import type {
	IntegracaoLogisticaBranchValues,
	IntegracaoLogisticaEncryptedKey,
	IntegracaoLogisticaFieldKey,
	IntegracaoLogisticaRecord,
	IntegracaoLogisticaValues,
} from '@/src/features/integracoes-logistica/services/integracao-logistica-mappers';

function hasSecretValue(record: IntegracaoLogisticaRecord, key: IntegracaoLogisticaFieldKey) {
	return record.values[key].trim().length > 0;
}

type Params = {
	initialRecord: IntegracaoLogisticaRecord;
	values: IntegracaoLogisticaValues;
	setValues: React.Dispatch<React.SetStateAction<IntegracaoLogisticaValues>>;
	branchValues: IntegracaoLogisticaBranchValues;
	setBranchValues: React.Dispatch<React.SetStateAction<IntegracaoLogisticaBranchValues>>;
};

export function useIntegracaoLogisticaPageState({ initialRecord, values, setValues, branchValues, setBranchValues }: Params) {
	const [editableSecrets, setEditableSecrets] = useState<Record<string, boolean>>({});

	const resetEditableSecrets = useCallback(() => {
		setEditableSecrets({});
	}, []);

	const hasChanges = useMemo(
		() => JSON.stringify(values) !== JSON.stringify(initialRecord.values) || JSON.stringify(branchValues) !== JSON.stringify(initialRecord.branchValues),
		[branchValues, initialRecord.branchValues, initialRecord.values, values],
	);

	const patch = useCallback(
		(key: IntegracaoLogisticaFieldKey, value: string) => {
			setValues((current) => ({ ...current, [key]: value }));
		},
		[setValues],
	);

	const patchBranch = useCallback(
		(branchId: string, key: 'companyId' | 'token', value: string) => {
			setBranchValues((current) => ({
				...current,
				[branchId]: {
					companyId: current[branchId]?.companyId ?? '',
					token: current[branchId]?.token ?? '',
					[key]: value,
				},
			}));
		},
		[setBranchValues],
	);

	const setSecretEditable = useCallback(
		(key: IntegracaoLogisticaEncryptedKey, editable: boolean) => {
			setEditableSecrets((current) => ({ ...current, [key]: editable }));
			patch(key, editable ? '' : initialRecord.values[key]);
		},
		[initialRecord.values, patch],
	);

	const setBranchTokenEditable = useCallback(
		(branchId: string, editable: boolean) => {
			const key = branchTokenKey(branchId);
			setEditableSecrets((current) => ({ ...current, [key]: editable }));
			patchBranch(branchId, 'token', editable ? '' : (initialRecord.branchValues[branchId]?.token ?? ''));
		},
		[initialRecord.branchValues, patchBranch],
	);

	const getIncludedEncryptedKeys = useCallback(() => {
		const keys: string[] = (['frenet_token', 'frenet_token_parceiro', 'mandae_token', 'freterapido_token', 'setcanhoto_token'] as IntegracaoLogisticaEncryptedKey[]).filter(
			(key) => editableSecrets[key] || !hasSecretValue(initialRecord, key),
		);

		for (const branch of initialRecord.branches) {
			const key = branchTokenKey(branch.id);
			const hasToken = (initialRecord.branchValues[branch.id]?.token ?? '').trim().length > 0;
			if (editableSecrets[key] || !hasToken) {
				keys.push(key);
			}
		}

		return keys;
	}, [editableSecrets, initialRecord]);

	return {
		editableSecrets,
		resetEditableSecrets,
		hasChanges,
		patch,
		patchBranch,
		setSecretEditable,
		setBranchTokenEditable,
		getIncludedEncryptedKeys,
	};
}
