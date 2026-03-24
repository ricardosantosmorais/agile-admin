import { GrupoComboFormPage } from '@/src/features/grupos-combos/components/grupo-combo-form-page'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <GrupoComboFormPage id={id} />
}
