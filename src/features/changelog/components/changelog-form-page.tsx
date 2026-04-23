'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { isRootAgileecommerceTenant } from '@/src/features/changelog/services/changelog-admin'
import { changelogClient } from '@/src/features/changelog/services/changelog-client'
import { CHANGELOG_CONFIG } from '@/src/features/changelog/services/changelog-config'

export function ChangelogFormPage({ id }: { id?: string }) {
	const { session } = useAuth()
	const isRootAdmin = isRootAgileecommerceTenant(session?.currentTenant.id || '') && session?.user.master === true

	if (!isRootAdmin) {
		return <AccessDeniedState title="Atualizações gerais" backHref="/dashboard" />
	}

	return <CrudFormPage config={CHANGELOG_CONFIG} client={changelogClient} id={id} />
}
