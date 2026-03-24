import { CorFormPage } from '@/src/features/cores/components/cor-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CorFormPage id={id} />
}
