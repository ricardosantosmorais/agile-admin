import { TributoFormPage } from '@/src/features/tributos/components/tributo-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TributoFormPage id={id} />
}
