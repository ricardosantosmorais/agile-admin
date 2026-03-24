import { PracaFormPage } from '@/src/features/pracas/components/praca-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PracaFormPage id={id} />
}
