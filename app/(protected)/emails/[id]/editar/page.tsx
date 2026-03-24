import { EmailsFormPage } from '@/src/features/emails/components/email-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EmailsFormPage id={id} />
}
