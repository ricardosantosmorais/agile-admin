import { TributoPartilhaFormPage } from '@/src/features/tributos-partilha/components/tributo-partilha-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TributoPartilhaFormPage id={id} />
}
