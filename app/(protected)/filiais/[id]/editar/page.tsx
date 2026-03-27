import { FilialFormPage } from '@/src/features/filiais/components/filial-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FilialFormPage id={id} />
}
