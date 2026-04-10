'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { emailsTemplatesClient } from '@/src/features/emails-templates/services/emails-templates-client'
import { EMAILS_TEMPLATES_CONFIG } from '@/src/features/emails-templates/services/emails-templates-config'

export function EmailsTemplatesListPage() {
  return <CrudListPage config={EMAILS_TEMPLATES_CONFIG} client={emailsTemplatesClient} />
}
