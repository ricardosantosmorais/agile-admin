'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { EMAILS_CONFIG } from '@/src/features/emails/services/emails-config'
import { emailsClient } from '@/src/features/emails/services/emails-client'

export function EmailsFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={EMAILS_CONFIG} client={emailsClient} id={id} />
}
