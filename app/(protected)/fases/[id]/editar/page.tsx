import { FaseFormPage } from '@/src/features/fases/components/fase-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FaseFormPage id={id} />
}
