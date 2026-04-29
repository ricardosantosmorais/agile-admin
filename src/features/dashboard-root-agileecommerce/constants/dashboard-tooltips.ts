/**
 * Dashboard Root Agile E-commerce - Tooltips e Explicações
 *
 * Este arquivo centraliza todos os textos explicativos que aparecem
 * quando o usuário passa o mouse ou clica em "?", "informações" ou ícones de ajuda.
 *
 * Integrar com Tooltip/Popover component do Shadcn/UI
 */

export const dashboardTooltips = {
	comercialRoot: {
		regraOficial: {
			titulo: 'Regra comercial oficial',
			descricao: 'Os pedidos são considerados pela data do pedido e classificados pelo status atual.',
			statusRealizados: ['faturado', 'entregue', 'em_separacao', 'em_transporte', 'recebido', 'coletado'],
			observacao: 'Status fora da whitelist aparecem na distribuição geral por status, mas não entram nos KPIs de receita, pedidos, ticket, rankings, concentração ou empresas sem venda.',
		},
		receitaRealizada: {
			titulo: 'Receita realizada',
			descricao: 'Soma dos pedidos cuja data está no período selecionado e cujo status atual está na whitelist comercial.',
		},
		pedidosRealizados: {
			titulo: 'Pedidos realizados',
			descricao: 'Quantidade de pedidos cuja data está no período selecionado e cujo status atual está na whitelist comercial.',
		},
		pedidosPorStatusAtual: {
			titulo: 'Pedidos por status atual',
			descricao: 'Distribuição atual dos pedidos do período por status atual. Não representa sequência histórica nem mudança de status ao longo do tempo.',
		},
		percentualCancelado: {
			titulo: 'Percentual cancelado',
			formula: 'pedidos cancelados / (pedidos realizados + pedidos cancelados)',
		},
	},

	// ============ RESUMO EXECUTIVO ============

	resumo: {
		empresasAtivasCard: {
			titulo: 'Empresas ativas',
			descricao: 'Quantas empresas da carteira estão operacionais. Exclui bloqueadas e em manutenção.',
			fonte: 'Tabela: empresas (status != bloqueada AND status != manutenção)',
			periodo: 'Snapshot atual',
		},

		empresasProducaoCard: {
			titulo: 'Empresas em produção',
			descricao: 'Quantas já migraram para ambiente produtivo real.',
			fonte: 'Tabela: empresas (status = produção)',
			periodo: 'Snapshot atual',
		},

		empresasHomologacaoCard: {
			titulo: 'Empresas em homologação',
			descricao: 'Quantas ainda estão em fase de testes antes de ir para produção.',
			fonte: 'Tabela: empresas (status = homologação)',
			periodo: 'Snapshot atual',
		},

		appsAtivosCard: {
			titulo: 'Apps ativos',
			descricao: 'Aplicativos móveis de clientes que estão publicados e funcionando.',
			fonte: 'Tabela: apps (status = ativo)',
			periodo: 'Snapshot atual',
		},

		pushesNoPeriodoCard: {
			titulo: 'Pushes no período',
			descricao: 'Notificações que foram enviadas aos usuários dos apps.',
			fonte: 'Tabela: notificacoes_apps (status = enviado)',
			periodo: 'Filtrável (padrão: últimos 30 dias)',
			exemplo: 'Se período é Mar 1-31: conta pushes enviados em março',
		},

		interacoesPushCard: {
			titulo: 'Interações push',
			descricao: 'Quantos usuários clicaram, abriram ou interagiram com as notificações.',
			fonte: 'Tabela: notificacoes_apps_interacoes (clique, abertura)',
			periodo: 'Filtrável (padrão: últimos 30 dias)',
		},

		taxaInteracaoPushCard: {
			titulo: 'Taxa interação push',
			descricao: 'Percentual de usuários que realmente interagiram com os pushes enviados.',
			formula: '(total_interacoes / total_enviados) × 100',
			periodo: 'Filtrável',
			exemplo: '500 cliques em 5.000 pushes = 10% de taxa',
		},

		processesTotaisCard: {
			titulo: 'Processos totais',
			descricao: 'Quantas tarefas internas rodaram: importação de planilhas, exportação de relatórios, sincronização de inventário, etc.',
			fonte: 'Tabela: processos (qualquer status)',
			periodo: 'Filtrável (padrão: últimos 30 dias)',
		},

		processosErroCard: {
			titulo: 'Processos com erro',
			descricao: 'Quantas dessas tarefas internas falharam ou não completaram com sucesso.',
			fonte: 'Tabela: processos (status = erro)',
			periodo: 'Filtrável (padrão: últimos 30 dias)',
		},

		taxaErroProcessosCard: {
			titulo: 'Taxa erro processos',
			descricao: 'Percentual de tarefas que falharam. Indicador de saúde operacional.',
			formula: '(processos_erro / processos_total) × 100',
			alerta: 'Acima de 10% é preocupante',
			periodo: 'Filtrável',
		},

		execucoesAgenteCard: {
			titulo: 'Execuções agente',
			descricao: 'Quantas vezes o agente de IA foi acionado e executado.',
			fonte: 'Tabela: agente_execucoes',
			periodo: 'Filtrável (padrão: últimos 30 dias)',
		},

		auditoriasMCPCard: {
			titulo: 'Auditorias MCP',
			descricao: 'Quantas ferramentas/tools o agente usou em suas execuções.',
			fonte: 'Tabela: mcp_audit_log (todos os registros)',
			periodo: 'Filtrável (padrão: últimos 30 dias)',
		},

		auditoriasMCPErroCard: {
			titulo: 'Auditorias MCP erro',
			descricao: 'Quantas dessas ferramentas tiveram erro ao executar.',
			fonte: 'Tabela: mcp_audit_log (status = erro)',
			periodo: 'Filtrável (padrão: últimos 30 dias)',
		},

		taxaErroMCPCard: {
			titulo: 'Taxa erro MCP',
			descricao: 'Percentual de ferramentas que falharam. Indicador de confiabilidade do agente.',
			formula: '(auditorias_erro / auditorias_total) × 100',
			alerta: 'Acima de 10% significa agente instável',
			periodo: 'Filtrável',
		},

		buildsComErroCard: {
			titulo: 'Builds com erro',
			descricao: 'Apps que falharam ao ser compilados ou publicados na loja.',
			fonte: 'Tabela: apps_logs (status = error)',
			periodo: 'Filtrável (padrão: últimos 30 dias)',
		},

		// Explicação geral da variação
		variacao: {
			titulo: 'Variação vs período anterior',
			descricao: 'Seta verde = aumentou. Seta vermelha = diminuiu. Compara com período anterior equivalente.',
			exemplo: 'Se período atual é Mar 1-31, variação compara com Fev 1-28',
		},

		// ============ PLATAFORMA ============

		plataforma: {
			statusEmpresas: {
				titulo: 'Status das Empresas',
				descricao: 'Distribuição de quantas empresas estão em cada estado operacional.',
				fonte: 'SELECT status, COUNT(*) FROM empresas GROUP BY status',
				valores: [
					'Produção: Já está rodando em produção',
					'Homologação: Ainda testando antes de ir para prod',
					'Bloqueada: Temporariamente suspensa',
					'Manutenção: Em manutenção programada',
				],
			},

			clusterDistribuicao: {
				titulo: 'Distribuição por Cluster',
				descricao: 'Mostra em qual data center / região cada empresa está rodando.',
				uso: 'Identificar se algum cluster está sobrecarregado',
				fonte: 'SELECT cluster, COUNT(*) FROM empresas GROUP BY cluster',
			},

			erpDistribuicao: {
				titulo: 'Distribuição por ERP',
				descricao: 'Qual sistema ERP cada empresa usa (SAP, Oracle, Tiny, etc).',
				uso: 'Entender complexidade de integrações',
				fonte: 'SELECT erp, COUNT(*) FROM empresas GROUP BY erp',
			},

			empresasSemApp: {
				titulo: 'Empresas sem app',
				descricao: 'Empresas que ainda não têm aplicativo mobile publicado ou ativo.',
				filtro: 'LEFT JOIN apps ON empresas.id = apps.id_empresa WHERE apps.id IS NULL',
				acao: 'Contatar para briefing de publicação',
				limite: 'Top 10 mais recentes',
			},

			empresasProblemasBuild: {
				titulo: 'Empresas com problema de build/publicação',
				descricao: 'Apps que falharam ao ser compilados ou publicados na loja. Precisam de suporte urgente.',
				filtro: 'apps_logs WHERE status IN (error, queued, building)',
				acao: 'Investigar erro de build e contatar empresa',
				limite: 'Top 10 mais recentes',
			},

			// ============ PRODUTOS ============

			criacao_apps_mensal: {
				titulo: 'Criação de Apps (série mensal)',
				descricao: 'Histórico de quantos apps novos foram criados por mês. Indicador de crescimento/adoção.',
				fonte: 'SELECT DATE_FORMAT(criado_em, %Y-%m) as mes, COUNT(*) FROM apps GROUP BY mes',
				trend: 'Linha subindo = mais novos clientes ou migrações',
			},

			notificacoes_mensal: {
				titulo: 'Notificações Publicadas (série mensal)',
				descricao: 'Volume de notificações mandadas para apps de clientes por mês.',
				fonte: 'SELECT DATE_FORMAT(data_envio, %Y-%m) as mes, COUNT(*) FROM notificacoes_apps GROUP BY mes',
				uso: 'Entender intensidade de campanhas de marketing/promoção',
			},

			logsStatus: {
				titulo: 'Status de Logs',
				descricao: 'Breakdown de sucessos vs erros/warnings durante compilação/publicação de apps.',
				fonte: 'SELECT status, COUNT(*) FROM apps_logs GROUP BY status',
				alerta: 'Muitos erros = investigar infraestrutura de build',
			},

			// ============ ENGAJAMENTO ============

			pushesEnviados: {
				titulo: 'Pushes Enviados (série mensal)',
				descricao: 'Volume de notificações push mandadas por mês.',
				fonte: 'SELECT DATE_FORMAT(data_envio, %Y-%m) as mes, COUNT(*) FROM notificacoes_apps',
				uso: 'Entender intensidade de campanhas',
			},

			interacoesPush: {
				titulo: 'Interações com Push (série mensal)',
				descricao: 'Quantos cliques/aberturas as notificações tiveram por mês.',
				fonte: 'SELECT DATE_FORMAT(data_interacao, %Y-%m) as mes, COUNT(*) FROM notificacoes_apps_interacoes',
				uso: 'Medir ROI de campanhas',
				benchmark: 'Taxa típica: 5-15% (varia por tipo de notificação)',
			},

			mensagensExternas: {
				titulo: 'Tipos de Mensagens Externas',
				descricao: 'Breakdown de Email, SMS, Webhook e outros canais de comunicação. Mostra taxa de sucesso.',
				fonte: 'SELECT tipo, COUNT(*), COUNT(IF(status=sucesso,1,NULL))/COUNT(*)*100 FROM mensagens_externas',
				uso: 'Entender efetividade de cada canal',
			},

			// ============ OPERAÇÃO ============

			processos_mensal: {
				titulo: 'Processos por Mês (série mensal)',
				descricao: 'Volume de tarefas internas processadas por mês.',
				fonte: 'SELECT DATE_FORMAT(data_inicio, %Y-%m) as mes, COUNT(*) FROM processos GROUP BY mes',
				uso: 'Identificar padrões de uso (ex: picos em meses de promoção)',
			},

			statusProcessos: {
				titulo: 'Status dos Processos',
				descricao: 'Proporção de quantos processos sucederam vs falharam vs pendentes.',
				fonte: 'SELECT status, COUNT(*) FROM processos WHERE data_inicio BETWEEN ? AND ?',
				alerta: 'Mais de 10% erro = problem crítico',
			},

			tiposProcessos: {
				titulo: 'Tipos de Processo',
				descricao: 'Quais tipos de tarefas internas mais rodão: importação, exportação, sync, etc.',
				fonte: 'SELECT tipo, COUNT(*) FROM processos GROUP BY tipo',
				uso: 'Entender qual funcionalidade é mais usada',
			},

			alertasProcessos: {
				titulo: 'Alertas de Processos Falhos Recentes',
				descricao: 'Últimas 20 falhas de processos agrupadas por empresa+tipo. Para triagem rápida.',
				filtro: `
          SELECT e.nome_fantasia, p.tipo, p.status, MAX(p.data_inicio)
          FROM processos p
          LEFT JOIN empresas e ON e.id = p.id_empresa
          WHERE p.status = 'erro' AND p.data_inicio BETWEEN ? AND ?
          GROUP BY e.id, p.tipo
          ORDER BY p.data_inicio DESC LIMIT 20
        `,
				agrupamento: 'Se mesma empresa+tipo teve múltiplos erros, mostra apenas o mais recente',
				acao: 'Clicar para investigar causa root',
				como_usar: ['1. Abrir dashboard', '2. Rolar até "Alertas de processos falhos"', '3. Verificar se há múltiplos erros da mesma empresa', '4. Se sim, escalate para suporte'],
			},

			logsErro: {
				titulo: 'Logs de Erro',
				descricao: 'Quantidade de mensagens de erro geradas durante execução de processos.',
				fonte: 'SELECT COUNT(*) FROM processos_logs WHERE level = erro',
			},

			logsInfo: {
				titulo: 'Logs de Informação',
				descricao: 'Quantidade de mensagens informativas geradas.',
				fonte: 'SELECT COUNT(*) FROM processos_logs WHERE level = info',
			},

			// ============ IA E GOVERNANÇA ============

			ia: {
				execucoesAgente: {
					titulo: 'Execuções do Agente por Dia',
					descricao: 'Quantas vezes o agente de IA foi acionado cada dia. Indicador de adoção.',
					fonte: 'SELECT DATE(criado_em) as dia, COUNT(*) FROM agente_execucoes GROUP BY dia',
					trend: 'Linha subindo = mais uso, adoção crescente',
					periodo: 'Últimos 30 dias',
				},

				auditoriaStatus: {
					titulo: 'Auditoria MCP por Status',
					descricao: 'Proporção de ferramentas que rodaram com sucesso vs erro. Indicador de confiabilidade.',
					fonte: 'SELECT status, COUNT(*) FROM mcp_audit_log GROUP BY status',
					valores: ['Sucesso: Tool completou normalmente', 'Erro: Tool falhou', 'Timeout: Tool demorou demais', 'Cancelado: User parou execução'],
					alerta: 'Acima de 10% erro = investigar',
				},

				mensagensUserVsAssistant: {
					titulo: 'Mensagens User vs Assistant',
					descricao: 'Proporção de mensagens do usuário vs respostas do agente.',
					fonte: `SELECT papel, COUNT(*) FROM agente_mensagens GROUP BY papel`,
					esperado: 'Deve ser próximo de 1:1 (um do usuário, uma do agente)',
					valores: ['Usuário: 310 mensagens', 'Assistente: 277 respostas'],
				},

				eventosAgente: {
					titulo: 'Eventos do Agente por Tipo',
					descricao: 'Breakdown de atividades do agente durante execução.',
					tipos: {
						atualizacaoStatus: 'Agent mudou de estado (idle → running → completed)',
						heartbeat: 'Agent está vivo (ping de saúde)',
						inicioTool: 'Agent começou usar uma ferramenta',
						fimTool: 'Agent terminou usar uma ferramenta',
						mensagemAssistente: 'Agent respondeu com mensagem',
						consultaSQL: 'Agent rodou uma query SQL',
						resultadoSQL: 'Agent recebeu resultado de SQL',
					},
					verificacao: 'Se "consulta SQL" >> "resultado SQL" = muitas queries falhando',
				},

				tools: {
					topTools: {
						titulo: 'Top Tools Usadas',
						descricao: 'Ferramentas mais usadas pelo agente. Mostra latência média.',
						colunas: ['Tool: Nome da ferramenta', 'Total: Quantas vezes foi usada', 'Latência média: Tempo médio de execução'],
						fonte: `SELECT tool_name, COUNT(*), AVG(duration_ms) FROM mcp_audit_log GROUP BY tool_name ORDER BY COUNT(*) DESC LIMIT 20`,
						exemplo: ['Consulta MySQL tenant: 2.972 usos, 139ms (ok)', 'Consulta SQL Server: 381 usos, 547ms (lento)', 'Busca modelo dados: 297 usos, 199ms (ok)'],
						benchmark: 'Menos de 200ms é ideal, 200-500ms aceitável, acima de 500ms preocupante',
					},

					alertasTools: {
						titulo: 'Alertas de Erro ou Lentidão por Tool',
						descricao: 'Ferramentas que tiveram ERROS ou estão muito LENTAS (>1s).',
						fonte: `SELECT tool_name, COUNT(*) as erros, AVG(duration_ms) FROM mcp_audit_log WHERE status='erro' OR duration_ms >= 1000 GROUP BY tool_name ORDER BY erros DESC LIMIT 20`,
						exemplo: ['Consulta MySQL: 495 erros, 139ms (database instável)', 'Inventário AWS: 15 erros, 2.416ms (timeout)', 'Gmail: 2 erros, 2.703ms (API indisponível)'],
						acao: 'Investigar causa: database down? Query ruim? API indisponível?',
					},
				},
			},
		},
	},

	// ============ GERAL ============

	geral: {
		periodoseletor: {
			titulo: 'Seletor de Período',
			descricao: 'Escolha qual período você quer ver os dados.',
			opcoes: ['Últimos 7 dias', 'Últimos 30 dias (padrão)', 'Últimos 90 dias', 'Customizado (escolha datas)'],
			comparativo: 'Sistema automaticamente pega período anterior equivalente para mostrar variações (↑ ou ↓)',
		},

		cache: {
			titulo: 'Cache de Dados',
			descricao: 'Dados são cacheados por 5 minutos para melhorar performance.',
			refresh: 'Clique "Forçar atualização" para descartar cache',
			hit: 'Se "Cache hit: true" = dados vieram do cache (até 5 min antigos)',
		},

		lazyLoading: {
			titulo: 'Carregamento Preguiçoso',
			descricao: 'Dashboard carrega dados em 6 fases para ser mais rápido. Cada fase só inicia após a anterior.',
			fases: [
				'1. Resumo (KPIs) - ~200ms',
				'2. Plataforma (Empresas/Apps) - ~150ms',
				'3. Produtos (Apps criados) - ~200ms',
				'4. Engajamento (Push/Notificações) - ~150ms',
				'5. Operação (Processos) - ~300ms',
				'6. IA e Governança (Agent/Tools) - ~250ms',
			],
			beneficio: 'Você vê números importantes (resumo) rápido. Detalhes carregam depois.',
		},

		formatacao: {
			numeros: 'Separador de milhar (1.234 em vez de 1234)',
			datas: 'Formato DD/MM/YYYY HH:mm',
			percentuais: 'Com 1 casa decimal (9.5% em vez de 9.532%)',
			latencia: 'Em millisegundos (ms)',
		},
	},
};

export const guiaRapido = {
	como_ler_um_alerta: `
    🔴 VERMELHO / CRÍTICO (taxa_erro > 10%)
    └─ Ação: Investigar imediatamente. Pode ser:
       - Servidor down
       - Bug no código
       - Serviço terceiro indisponível

    🟡 AMARELO / ATENÇÃO (taxa_erro 5-10%)
    └─ Ação: Observar. Não é crítico mas fique atento.

    🟢 VERDE / OK (taxa_erro < 5%)
    └─ Ação: Continuar monitorando normalmente.
  `,

	dicas_rapidas: [
		'Se um gráfico está em branco = sem dados para o período selecionado',
		'Se uma seção não carrega = verificar DevTools → Network e ver erro',
		'Passar mouse sobre título = ver tooltip com explicação',
		'Clicar em "?" ao lado de métrica = expandir explicação detalhada',
		'Exportar: ainda não disponível, mas no roadmap (CSV/PDF)',
	],

	roadmap: [
		'Exportar dados em CSV/PDF',
		'Alertas automáticos (Slack/email quando erro > X%)',
		'Drill-down: clicar numa empresa e ver detalhes',
		'Integração com PagerDuty/Opsgenie',
		'Visualizador de logs em tempo real',
		'Customização de widgets por usuário',
	],
};
