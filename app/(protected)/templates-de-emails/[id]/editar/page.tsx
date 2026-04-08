import { EmailsTemplatesFormPage } from '@/src/features/emails-templates/components/emails-templates-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EmailsTemplatesFormPage id={id} />
}
