import { SequencialFormPage } from '@/src/features/sequenciais/components/sequencial-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SequencialFormPage id={id} />
}
