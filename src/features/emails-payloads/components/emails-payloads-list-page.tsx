'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { emailsPayloadsClient } from '@/src/features/emails-payloads/services/emails-payloads-client'
import { EMAILS_PAYLOADS_CONFIG } from '@/src/features/emails-payloads/services/emails-payloads-config'

export function EmailsPayloadsListPage() {
  return <CrudListPage config={EMAILS_PAYLOADS_CONFIG} client={emailsPayloadsClient} />
}
