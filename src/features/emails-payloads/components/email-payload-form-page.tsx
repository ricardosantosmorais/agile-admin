'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { emailsPayloadsClient } from '@/src/features/emails-payloads/services/emails-payloads-client'
import { EMAILS_PAYLOADS_CONFIG } from '@/src/features/emails-payloads/services/emails-payloads-config'

export function EmailPayloadFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={EMAILS_PAYLOADS_CONFIG} client={emailsPayloadsClient} id={id} />
}
