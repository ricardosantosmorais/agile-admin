type DashboardTranslate = (key: string, fallback: string) => string;

function normalizeValue(value: unknown) {
	return String(value ?? '')
		.trim()
		.toLowerCase();
}

function humanizeIdentifier(value: unknown) {
	const text = String(value ?? '').trim();
	if (!text) {
		return '-';
	}

	return text
		.replace(/[_-]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function translateMappedValue(value: unknown, translate: DashboardTranslate, prefix: string, fallbacks: Record<string, string>) {
	const normalized = normalizeValue(value);
	if (!normalized) {
		return translate(`${prefix}.empty`, 'Não informado');
	}

	if (normalized in fallbacks) {
		return translate(`${prefix}.${normalized}`, fallbacks[normalized]);
	}

	return humanizeIdentifier(value);
}

export function formatDashboardRootAttentionLabel(key: string, translate: DashboardTranslate) {
	return translateMappedValue(key, translate, 'dashboardRoot.attention', {
		empresas_bloqueadas: 'Empresas bloqueadas',
		empresas_manutencao: 'Empresas em manutenção',
		empresas_sem_app: 'Empresas sem app',
		empresas_com_build_falho_recente: 'Com falha recente de build',
	});
}

export function formatDashboardRootCompanyStatus(value: unknown, translate: DashboardTranslate) {
	return translateMappedValue(value, translate, 'dashboardRoot.status.company', {
		producao: 'Em produção',
		homologacao: 'Em homologação',
		bloqueado: 'Bloqueada',
		manutencao: 'Em manutenção',
		ativo: 'Ativa',
		inativo: 'Inativa',
		nao_informado: 'Não informado',
	});
}

export function formatDashboardRootBuildStatus(value: unknown, translate: DashboardTranslate) {
	return translateMappedValue(value, translate, 'dashboardRoot.status.build', {
		error: 'Erro',
		queued: 'Na fila',
		building: 'Em build',
		processing: 'Processando',
		processed: 'Processado',
		success: 'Concluído',
		failed: 'Falhou',
		pending: 'Pendente',
		nao_informado: 'Não informado',
	});
}

export function formatDashboardRootTransportStatus(value: unknown, translate: DashboardTranslate) {
	return translateMappedValue(value, translate, 'dashboardRoot.status.transport', {
		read: 'Lida',
		processed: 'Processada',
		delivered: 'Entregue',
		sent: 'Enviada',
		processing_failed: 'Falha no processamento',
		rejected_unregistered: 'Rejeitada por cadastro ausente',
		pending: 'Pendente',
		failed: 'Falhou',
		nao_informado: 'Não informado',
	});
}

export function formatDashboardRootProcessStatus(value: unknown, translate: DashboardTranslate) {
	return translateMappedValue(value, translate, 'dashboardRoot.status.process', {
		erro: 'Erro',
		finalizado: 'Finalizado',
		cancelado: 'Cancelado',
		processando: 'Em processamento',
		pendente: 'Pendente',
		agendado: 'Agendado',
		nao_informado: 'Não informado',
	});
}

export function formatDashboardRootProcessType(value: unknown, translate: DashboardTranslate) {
	return translateMappedValue(value, translate, 'dashboardRoot.processType', {
		relatorio_exportacao: 'Exportação de relatório',
		relatorio_importacao: 'Importação de relatório',
		'exportar relatorio': 'Exportação de relatório',
		'importacao planilha': 'Importação de planilha',
		importacao: 'Importação',
		exportacao: 'Exportação',
		notificacao: 'Notificação',
		sincronizacao: 'Sincronização',
		nao_informado: 'Não informado',
	});
}

export function formatDashboardRootAgentRole(value: unknown, translate: DashboardTranslate) {
	return translateMappedValue(value, translate, 'dashboardRoot.agentRole', {
		user: 'Usuário',
		assistant: 'Assistente',
		system: 'Sistema',
		tool: 'Tool',
	});
}

export function formatDashboardRootAgentEventType(value: unknown, translate: DashboardTranslate) {
	return translateMappedValue(value, translate, 'dashboardRoot.agentEvent', {
		status: 'Atualização de status',
		heartbeat: 'Heartbeat',
		tool_start: 'Início de tool',
		tool_end: 'Fim de tool',
		assistant_message: 'Mensagem do assistente',
		sql: 'Consulta SQL',
		sql_result: 'Resultado SQL',
		llm_start: 'Início do modelo',
		llm_end: 'Fim do modelo',
		message_ack: 'Confirmação de mensagem',
		capability: 'Capacidade',
		routing: 'Roteamento',
		final: 'Finalização',
		eof: 'Fim do fluxo',
	});
}

export function formatDashboardRootToolName(value: unknown, translate: DashboardTranslate) {
	return translateMappedValue(value, translate, 'dashboardRoot.toolName', {
		mysql_tenant_query: 'Consulta MySQL do tenant',
		sqlserver_query: 'Consulta SQL Server',
		mysql_admin_query: 'Consulta MySQL administrativa',
		data_model_search: 'Busca no modelo de dados',
		aws_cloudwatch_metric_get: 'Leitura de métrica CloudWatch',
		data_model_table_get: 'Consulta de tabela do modelo de dados',
		parameter_catalog_search: 'Busca no catálogo de parâmetros',
		intercom_search: 'Busca no Intercom',
		aws_inventory: 'Inventário AWS',
		notion_search: 'Busca no Notion',
		gmail_list_threads: 'Listagem de conversas do Gmail',
		data_model_catalog_list: 'Listagem de catálogos do modelo de dados',
		aws_ssm_get_command_invocation: 'Consulta de execução SSM',
		data_model_relationships_get: 'Consulta de relacionamentos do modelo de dados',
	});
}

export function formatDashboardRootProcessErrorMessage(value: unknown, translate: DashboardTranslate) {
	const text = String(value ?? '').trim();
	if (!text) {
		return translate('dashboardRoot.processError.empty', 'Sem detalhe disponível');
	}

	const cleaned = text
		.replace(/^Houve um problema na execução do processo\s+\d+:\s*/i, '')
		.replace(/^System\.Exception:\s*/i, '')
		.trim();

	if (/only_full_group_by/i.test(cleaned)) {
		return translate('dashboardRoot.processError.onlyFullGroupBy', 'Consulta SQL incompatível com o modo estrito do MySQL. Ajuste o GROUP BY da exportação.');
	}

	if (/RelatorioArquivoExportService|ExportarParaS3|GerarArquivoExcel/i.test(cleaned)) {
		return translate('dashboardRoot.processError.reportExportFailure', 'Falha ao exportar relatório por incompatibilidade SQL no banco do tenant.');
	}

	if (/endpoint n[aã]o registrado|endpoint not registered/i.test(cleaned)) {
		return translate('dashboardRoot.processError.endpointNotRegistered', 'Endpoint da exportação não está cadastrado no serviço chamado pelo processo.');
	}

	if (/parametro\s+'[^']+_db_constr'\s+n[aã]o registrado|parameter\s+'[^']+_db_constr'\s+not registered/i.test(cleaned)) {
		return translate('dashboardRoot.processError.connectionParameterMissing', 'Parâmetro de conexão do tenant não está cadastrado para esse processo.');
	}

	if (/wait_timeout|interactive_timeout|disconnected by the server because of inactivity/i.test(cleaned)) {
		return translate('dashboardRoot.processError.connectionTimeout', 'A conexão com o banco do tenant expirou durante a execução do processo.');
	}

	if (/maximum statement execution time exceeded/i.test(cleaned)) {
		return translate('dashboardRoot.processError.statementTimeout', 'A consulta do relatório excedeu o tempo máximo permitido no banco do tenant.');
	}

	const firstLine = cleaned.split(/\r?\n|\s+em\s+[A-Z]:\\/)[0]?.trim() ?? cleaned;

	if (firstLine.length <= 180) {
		return firstLine;
	}

	return `${firstLine.slice(0, 177)}...`;
}

export function formatDashboardRootPlatform(value: unknown, translate: DashboardTranslate) {
	return translateMappedValue(value, translate, 'dashboardRoot.platformName', {
		ios: 'iOS',
		android: 'Android',
		web: 'Web',
		pwa: 'PWA',
		api: 'API',
		nao_informado: 'Não informado',
	});
}
