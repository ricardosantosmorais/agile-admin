'use client'

import Link from 'next/link'
import { ArrowUpRight, Blocks, Bolt, Cable, Database, FileCode2, FileJson2, Layers3, Network, PackageSearch, Puzzle, Settings2, Waypoints } from 'lucide-react'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { useI18n } from '@/src/i18n/use-i18n'
import { isRootAgileecommerceAdmin } from '@/src/lib/root-tenant'

type ErpCatalogCard = {
	key: string
	icon: typeof PackageSearch
	legacyComponent?: string
	href?: string
	migrated?: boolean
}

const ERP_CATALOGS: ErpCatalogCard[] = [
	{ key: 'erps', icon: PackageSearch, href: '/integracao-com-erp/cadastros/erps', migrated: true },
	{ key: 'templates', icon: Blocks, href: '/integracao-com-erp/cadastros/templates', migrated: true },
	{ key: 'parametrosGrupo', icon: Layers3, href: '/integracao-com-erp/cadastros/parametros-grupo', migrated: true },
	{ key: 'parametrosCadastro', icon: Settings2, href: '/integracao-com-erp/cadastros/parametros-cadastro', migrated: true },
	{ key: 'queries', icon: FileCode2, href: '/integracao-com-erp/cadastros/queries', migrated: true },
	{ key: 'scripts', icon: FileJson2, href: '/integracao-com-erp/cadastros/scripts', migrated: true },
	{ key: 'endpoints', icon: Cable, href: '/integracao-com-erp/cadastros/endpoints', migrated: true },
	{ key: 'gateways', icon: Network, href: '/integracao-com-erp/cadastros/gateways', migrated: true },
	{ key: 'gatewayEndpoints', icon: Puzzle, href: '/integracao-com-erp/cadastros/gateway-endpoints', migrated: true },
	{ key: 'interfacesConsulta', icon: Waypoints, href: '/integracao-com-erp/cadastros/interfaces-consulta', migrated: true },
	{ key: 'acoes', icon: Bolt, href: '/integracao-com-erp/cadastros/acoes', migrated: true },
	{ key: 'servicos', icon: Database, href: '/integracao-com-erp/cadastros/servicos', migrated: true },
] as const

export function IntegracaoComErpCadastrosPage() {
	const { session } = useAuth()
	const { t } = useI18n()

	if (!isRootAgileecommerceAdmin(session)) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.catalogs.title', 'Cadastros ERP')} backHref="/dashboard" />
	}

	return (
		<div className="space-y-5">
			<PageHeader
				breadcrumbs={[
					{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
					{ label: t('menuKeys.integracao-erp', 'Integração com ERP'), href: '/integracao-com-erp/dashboard' },
					{ label: t('menuKeys.integracao-erp-cadastros-list', 'Cadastros'), href: '/integracao-com-erp/cadastros' },
				]}
			/>

			<SectionCard
				title={t('maintenance.erpIntegration.catalogs.title', 'Cadastros ERP')}
				description={t(
					'maintenance.erpIntegration.catalogs.description',
					'Entrada de migração do bloco Cadastros de Integração com ERP. Os itens abaixo já foram organizados no v2 e seguem apontando para o legado até cada cadastro ganhar seu módulo próprio.',
				)}
			>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{ERP_CATALOGS.map((item) => {
						const Icon = item.icon
						const targetHref = item.href ?? (item.legacyComponent ? `/legacy/${encodeURIComponent(item.legacyComponent)}` : '/integracao-com-erp/cadastros')

						return (
							<div key={item.key} className="app-pane rounded-[1.25rem] p-4">
								<div className="flex items-start justify-between gap-3">
									<div className="app-control-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
										<Icon className="h-5 w-5 text-[color:var(--app-text)]" />
									</div>
									<StatusBadge tone={item.migrated ? 'success' : 'warning'}>
										{item.migrated
											? t('maintenance.erpIntegration.catalogs.v2Badge', 'V2')
											: t('maintenance.erpIntegration.catalogs.legacyBadge', 'Legado')}
									</StatusBadge>
								</div>

								<div className="mt-4 space-y-2">
									<h2 className="text-base font-bold text-[color:var(--app-text)]">
										{t(`maintenance.erpIntegration.catalogs.items.${item.key}.title`, item.key)}
									</h2>
									<p className="text-sm leading-6 text-[color:var(--app-muted)]">
										{t(`maintenance.erpIntegration.catalogs.items.${item.key}.description`, '')}
									</p>
								</div>

								<div className="mt-5">
									<Link
										href={targetHref}
										prefetch={false}
										className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
									>
										<ArrowUpRight className="h-4 w-4" />
										{item.migrated
											? t('maintenance.erpIntegration.catalogs.openModule', 'Abrir módulo')
											: t('maintenance.erpIntegration.catalogs.openLegacy', 'Abrir legado')}
									</Link>
								</div>
							</div>
						)
					})}
				</div>
			</SectionCard>
		</div>
	)
}
