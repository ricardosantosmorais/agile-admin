import { ComboFormPage } from '@/src/features/combos/components/combo-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ComboFormPage id={id} />
}
