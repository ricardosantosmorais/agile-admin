'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { isRootAgileecommerceTenant } from '@/src/features/changelog/services/changelog-admin'
import { changelogClient } from '@/src/features/changelog/services/changelog-client'
import { CHANGELOG_CONFIG } from '@/src/features/changelog/services/changelog-config'

export function ChangelogListPage() {
	const { session } = useAuth()
	const isRootAdmin = isRootAgileecommerceTenant(session?.currentTenant.id || '') && session?.user.master === true

	if (!isRootAdmin) {
		return <AccessDeniedState title="Atualizações gerais" backHref="/dashboard" />
	}

	return <CrudListPage config={CHANGELOG_CONFIG} client={changelogClient} />
}
