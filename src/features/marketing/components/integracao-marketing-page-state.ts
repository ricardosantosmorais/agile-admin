'use client';

import { useEffect, useMemo, useState } from 'react';
import { integracaoMarketingClient } from '@/src/features/marketing/services/integracao-marketing-client';
import {
	hasIntegracaoMarketingRdEcomEvents,
	integracaoMarketingEncryptedKeys,
	type IntegracaoMarketingFieldKey,
	type IntegracaoMarketingRecord,
	type IntegracaoMarketingValues,
} from '@/src/features/marketing/services/integracao-marketing-mappers';

type TranslationFn = (key: string, fallback: string, params?: Record<string, string>) => string;

function hasSecretValue(record: IntegracaoMarketingRecord, key: IntegracaoMarketingFieldKey) {
	return record.values[key].trim().length > 0;
}

type Params = {
	initialRecord: IntegracaoMarketingRecord;
	values: IntegracaoMarketingValues;
	setValues: React.Dispatch<React.SetStateAction<IntegracaoMarketingValues>>;
	setFeedback: React.Dispatch<React.SetStateAction<{ tone: 'success' | 'error'; message: string } | null>>;
	t: TranslationFn;
};

export function useIntegracaoMarketingPageState({ initialRecord, values, setValues, setFeedback, t }: Params) {
	const [editableSecrets, setEditableSecrets] = useState<Record<string, boolean>>({});
	const [connectingRdEcom, setConnectingRdEcom] = useState(false);
	const [rdEcomOauthConnected, setRdEcomOauthConnected] = useState(false);
	const [rdEcomCallbackUrl, setRdEcomCallbackUrl] = useState('');

	useEffect(() => {
		setEditableSecrets({});
		setRdEcomOauthConnected(initialRecord.values.rd_ecom_refresh_token.trim().length > 0);
	}, [initialRecord]);

	useEffect(() => {
		setRdEcomCallbackUrl(`${window.location.origin}/api/integracoes/marketing/rd-ecom-oauth/callback`);
	}, []);

	useEffect(() => {
		function handleMessage(event: MessageEvent) {
			if (event.origin !== window.location.origin) {
				return;
			}

			const data = event.data as { type?: string; success?: boolean; refresh_token?: string; message?: string };
			if (data?.type !== 'rd_ecom_oauth_result') {
				return;
			}

			if (data.success && data.refresh_token) {
				setValues((current) => ({ ...current, rd_ecom_refresh_token: data.refresh_token ?? '' }));
				setEditableSecrets((current) => ({ ...current, rd_ecom_refresh_token: true }));
				setRdEcomOauthConnected(true);
				setFeedback({ tone: 'success', message: data.message || t('integrationsMarketing.feedback.rdEcomConnected', 'Conexao com a RD Station realizada com sucesso.') });
				return;
			}

			setRdEcomOauthConnected(false);
			setFeedback({ tone: 'error', message: data.message || t('integrationsMarketing.feedback.rdEcomCompleteError', 'Nao foi possivel concluir a conexao com a RD Station.') });
		}

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [setFeedback, setValues, t]);

	const hasChanges = useMemo(
		() => Object.keys(values).some((key) => values[key as IntegracaoMarketingFieldKey] !== initialRecord.values[key as IntegracaoMarketingFieldKey]),
		[initialRecord.values, values],
	);

	function patch(key: IntegracaoMarketingFieldKey, value: string) {
		setValues((current) => ({ ...current, [key]: value }));
		if (key === 'rd_ecom_client_id') {
			const sameClientId = value.trim() === initialRecord.values.rd_ecom_client_id.trim();
			const hasInitialToken = initialRecord.values.rd_ecom_refresh_token.trim().length > 0;
			if (sameClientId && hasInitialToken && !editableSecrets.rd_ecom_client_secret) {
				setRdEcomOauthConnected(true);
				setValues((current) => ({ ...current, rd_ecom_refresh_token: initialRecord.values.rd_ecom_refresh_token }));
				setEditableSecrets((current) => ({ ...current, rd_ecom_refresh_token: false }));
			} else {
				setRdEcomOauthConnected(false);
				setValues((current) => ({ ...current, rd_ecom_refresh_token: '' }));
				setEditableSecrets((current) => ({ ...current, rd_ecom_refresh_token: true }));
			}
		}

		if (key === 'rd_ecom_client_secret') {
			setRdEcomOauthConnected(false);
			setValues((current) => ({ ...current, rd_ecom_refresh_token: '' }));
			setEditableSecrets((current) => ({ ...current, rd_ecom_refresh_token: true }));
		}
	}

	function setSecretEditable(key: IntegracaoMarketingFieldKey, editable: boolean) {
		setEditableSecrets((current) => ({ ...current, [key]: editable }));
		if (editable) {
			patch(key, '');
			if (key === 'rd_ecom_client_secret') {
				setRdEcomOauthConnected(false);
				patch('rd_ecom_refresh_token', '');
				setEditableSecrets((current) => ({ ...current, rd_ecom_client_secret: true, rd_ecom_refresh_token: true }));
			}
			return;
		}

		patch(key, initialRecord.values[key]);
		if (key === 'rd_ecom_client_secret' && initialRecord.values.rd_ecom_refresh_token) {
			patch('rd_ecom_refresh_token', initialRecord.values.rd_ecom_refresh_token);
			setRdEcomOauthConnected(true);
		}
	}

	function getIncludedEncryptedKeys() {
		return integracaoMarketingEncryptedKeys.filter((key) => editableSecrets[key] || !hasSecretValue(initialRecord, key));
	}

	function validateBeforeSave() {
		if (!hasIntegracaoMarketingRdEcomEvents(values)) {
			return true;
		}

		const hasClientSecret = editableSecrets.rd_ecom_client_secret ? values.rd_ecom_client_secret.trim().length > 0 : hasSecretValue(initialRecord, 'rd_ecom_client_secret');
		const hasRefreshToken = editableSecrets.rd_ecom_refresh_token ? values.rd_ecom_refresh_token.trim().length > 0 : hasSecretValue(initialRecord, 'rd_ecom_refresh_token');

		if (!values.rd_ecom_client_id.trim()) {
			setFeedback({ tone: 'error', message: t('integrationsMarketing.feedback.rdEcomClientIdRequired', 'Para ativar o RD Station E-Commerce, informe o ID do aplicativo.') });
			return false;
		}

		if (!hasClientSecret) {
			setFeedback({ tone: 'error', message: t('integrationsMarketing.feedback.rdEcomSecretRequired', 'Para ativar o RD Station E-Commerce, informe a senha do aplicativo.') });
			return false;
		}

		if (!hasRefreshToken || (!rdEcomOauthConnected && (editableSecrets.rd_ecom_client_secret || editableSecrets.rd_ecom_refresh_token))) {
			setFeedback({
				tone: 'error',
				message: t('integrationsMarketing.feedback.rdEcomConnectRequired', 'Conecte com a RD Station antes de salvar as configuracoes do RD Station E-Commerce.'),
			});
			return false;
		}

		return true;
	}

	async function handleRdEcomConnect() {
		const useCurrentSecret = !editableSecrets.rd_ecom_client_secret && hasSecretValue(initialRecord, 'rd_ecom_client_secret');
		const clientSecret = useCurrentSecret ? '' : values.rd_ecom_client_secret.trim();

		if (!values.rd_ecom_client_id.trim()) {
			setFeedback({ tone: 'error', message: t('integrationsMarketing.feedback.rdEcomClientIdRequired', 'Para ativar o RD Station E-Commerce, informe o ID do aplicativo.') });
			return;
		}

		if (!useCurrentSecret && !clientSecret) {
			setFeedback({ tone: 'error', message: t('integrationsMarketing.feedback.rdEcomSecretRequired', 'Para ativar o RD Station E-Commerce, informe a senha do aplicativo.') });
			return;
		}

		try {
			setConnectingRdEcom(true);
			const result = await integracaoMarketingClient.startRdEcomOauth({
				clientId: values.rd_ecom_client_id,
				clientSecret,
				useCurrentSecret,
			});
			const oauthUrl = result.data?.oauth_url ?? '';
			if (!oauthUrl) {
				throw new Error(t('integrationsMarketing.feedback.rdEcomOauthUrlError', 'Nao foi possivel gerar a URL de conexao com a RD Station.'));
			}

			const popup = window.open(oauthUrl, 'rd_ecom_oauth', 'width=700,height=760,scrollbars=yes,resizable=yes');
			if (!popup) {
				throw new Error(t('integrationsMarketing.feedback.rdEcomPopupBlocked', 'Desbloqueie pop-ups para concluir a conexao com a RD Station.'));
			}
			popup.focus();
			setFeedback({ tone: 'success', message: t('integrationsMarketing.feedback.rdEcomWaiting', 'Aguardando autorizacao da RD Station...') });
		} catch (connectError) {
			setFeedback({
				tone: 'error',
				message:
					connectError instanceof Error ? connectError.message : t('integrationsMarketing.feedback.rdEcomStartError', 'Nao foi possivel iniciar a conexao com a RD Station.'),
			});
		} finally {
			setConnectingRdEcom(false);
		}
	}

	async function handleCopyRdEcomCallback() {
		if (!rdEcomCallbackUrl) {
			setFeedback({ tone: 'error', message: t('integrationsMarketing.feedback.rdEcomCallbackMissing', 'URL de callback nao informada para copia.') });
			return;
		}

		try {
			await navigator.clipboard.writeText(rdEcomCallbackUrl);
			setFeedback({ tone: 'success', message: t('integrationsMarketing.feedback.rdEcomCallbackCopied', 'URL de callback copiada.') });
		} catch {
			setFeedback({ tone: 'error', message: t('integrationsMarketing.feedback.rdEcomCallbackCopyError', 'Nao foi possivel copiar a URL de callback.') });
		}
	}

	return {
		editableSecrets,
		connectingRdEcom,
		rdEcomOauthConnected,
		rdEcomCallbackUrl,
		hasChanges,
		patch,
		setSecretEditable,
		getIncludedEncryptedKeys,
		validateBeforeSave,
		handleRdEcomConnect,
		handleCopyRdEcomCallback,
	};
}
