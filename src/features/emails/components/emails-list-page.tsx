'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { EMAILS_CONFIG } from '@/src/features/emails/services/emails-config'
import { emailsClient } from '@/src/features/emails/services/emails-client'

export function EmailsListPage() {
  return <CrudListPage config={EMAILS_CONFIG} client={emailsClient} />
}
