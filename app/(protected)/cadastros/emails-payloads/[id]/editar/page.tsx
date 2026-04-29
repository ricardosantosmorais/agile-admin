import { EmailPayloadFormPage } from '@/src/features/emails-payloads/components/email-payload-form-page'

export default async function EditarEmailPayloadRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EmailPayloadFormPage id={id} />
}
